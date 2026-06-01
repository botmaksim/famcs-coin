package repository

import (
	"context"
	"fmt"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository interface {
	CreateOrUpdateUser(ctx context.Context, user *models.User) error
	GetUserByID(ctx context.Context, tgID int64) (*models.User, error)
	UpdateBalance(ctx context.Context, tgID int64, amount float64) error
	GetLeaderboard(ctx context.Context, limit int) ([]*models.User, error)
	JoinSquad(ctx context.Context, tgID int64, squadID int) error
	UpdateSleepUntil(ctx context.Context, tgID int64, sleepUntil *time.Time) error
	TipUser(ctx context.Context, senderID, receiverID int64, amount float64) error
	BonusDrop(ctx context.Context, adminID, targetID int64, amount float64) error
	UpdateUserRoleAndPermissions(ctx context.Context, adminID, targetID int64, newRole string, permissions []string) error
	GenerateAdminInvite(ctx context.Context, adminID int64, role string) (string, error)
	AcceptAdminInvite(ctx context.Context, token string, tgID int64) error
	GetPublicLeaderboard(ctx context.Context, limit int) ([]*models.User, error)
	GetHallOfFame(ctx context.Context) ([]*models.User, error)
	BanUser(ctx context.Context, tgID int64, isBanned bool, reason string) error
}

type userRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) UserRepository {
	return &userRepository{pool: pool}
}

func (r *userRepository) CreateOrUpdateUser(ctx context.Context, user *models.User) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check if user already exists
	var exists bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM users WHERE tg_id = $1", user.TgID).Scan(&exists)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("failed to check existing user: %w", err)
	}

	if exists {
		// Just update
		query := `
			UPDATE users SET
				username = $1,
				avatar_url = COALESCE($2, avatar_url),
				last_active_at = CURRENT_TIMESTAMP
			WHERE tg_id = $3
		`
		_, err = tx.Exec(ctx, query, user.Username, user.AvatarURL, user.TgID)
		if err != nil {
			return fmt.Errorf("update user exec error: %w", err)
		}
	} else {
		// New user
		
		// Check if it's the first user
		var userCount int
		err = tx.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&userCount)
		if err == nil && userCount == 0 {
			user.Role = "superadmin"
		}

		query := `
			INSERT INTO users (tg_id, username, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, is_anonymous_tips, referred_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`
		_, err = tx.Exec(ctx, query,
			user.TgID, user.Username, user.AvatarURL, user.Role, user.Balance, user.Energy,
			user.MaxEnergy, user.PassiveIncome, user.IsHidden, user.IsAnonymousTips, user.ReferredBy)
		if err != nil {
			return fmt.Errorf("insert user exec error: %w", err)
		}

		// Apply referral bonus if referred_by is set
		if user.ReferredBy != nil {
			bonusAmount := 50000.0
			
			// Give bonus to the new user
			_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", bonusAmount, user.TgID)
			if err != nil {
				return fmt.Errorf("failed to add bonus to new user: %w", err)
			}
			
			// Give bonus to the referrer (if they exist)
			_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", bonusAmount, *user.ReferredBy)
			if err != nil {
				// We don't fail here because the referrer might be invalid or deleted
				fmt.Printf("failed to add bonus to referrer: %v\n", err)
			} else {
				// Record transactions
				tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES (NULL, $1, $2, 'referral_bonus')", user.TgID, bonusAmount)
				tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES (NULL, $1, $2, 'referral_bonus')", *user.ReferredBy, bonusAmount)
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *userRepository) GetUserByID(ctx context.Context, tgID int64) (*models.User, error) {
	query := `
		SELECT u.tg_id, u.username, u.custom_name, u.avatar_url, u.role, u.balance, u.energy, u.max_energy, 
		       u.passive_income, u.squad_id, u.is_hidden, u.is_anonymous_tips, u.sleep_until, u.suspended_at, u.last_active_at, s.image_url, u.permissions, u.wallet_address, u.is_banned, u.ban_reason
		FROM users u
		LEFT JOIN skins s ON u.active_skin_id = s.id
		WHERE u.tg_id = $1
	`
	user := &models.User{}
	var avatarURL *string
	err := r.pool.QueryRow(ctx, query, tgID).Scan(
		&user.TgID, &user.Username, &user.CustomName, &avatarURL, &user.Role, &user.Balance,
		&user.Energy, &user.MaxEnergy, &user.PassiveIncome, &user.SquadID,
		&user.IsHidden, &user.IsAnonymousTips, &user.SleepUntil, &user.SuspendedAt, &user.LastActiveAt, &user.ActiveSkinURL, &user.Permissions, &user.WalletAddr, &user.IsBanned, &user.BanReason,
	)
	if avatarURL != nil {
		user.AvatarURL = *avatarURL
	}
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, fmt.Errorf("GetUserByID query error: %w", err)
	}
	return user, nil
}

func (r *userRepository) UpdateBalance(ctx context.Context, tgID int64, amount float64) error {
	// using transaction as requested for balance change
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `UPDATE users SET balance = balance + $1 WHERE tg_id = $2`
	_, err = tx.Exec(ctx, query, amount, tgID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *userRepository) GetLeaderboard(ctx context.Context, limit int) ([]*models.User, error) {
	query := `
		SELECT tg_id, username, custom_name, balance, passive_income, squad_id
		FROM users
		WHERE is_hidden = FALSE
		ORDER BY balance DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("GetLeaderboard query error: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(&user.TgID, &user.Username, &user.CustomName, &user.Balance, &user.PassiveIncome, &user.SquadID)
		if err != nil {
			return nil, fmt.Errorf("GetLeaderboard scan error: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *userRepository) GetPublicLeaderboard(ctx context.Context, limit int) ([]*models.User, error) {
	// Returns users ordered by balance. If is_hidden, mask name and avatar.
	query := `
		SELECT tg_id, username, custom_name, balance, passive_income, squad_id, is_hidden, avatar_url, s.image_url
		FROM users u
		LEFT JOIN skins s ON u.active_skin_id = s.id
		ORDER BY balance DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("GetPublicLeaderboard query error: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		var avatarURL *string
		err := rows.Scan(&user.TgID, &user.Username, &user.CustomName, &user.Balance, &user.PassiveIncome, &user.SquadID, &user.IsHidden, &avatarURL, &user.ActiveSkinURL)
		if err != nil {
			return nil, fmt.Errorf("GetPublicLeaderboard scan error: %w", err)
		}
		
		if user.IsHidden {
			user.Username = "Анонимный Студент"
			user.CustomName = nil
			user.AvatarURL = ""
			user.ActiveSkinURL = nil
		} else if avatarURL != nil {
			user.AvatarURL = *avatarURL
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *userRepository) GetHallOfFame(ctx context.Context) ([]*models.User, error) {
	query := `
		SELECT tg_id, username, custom_name, avatar_url, role, responsibility, s.image_url
		FROM users u
		LEFT JOIN skins s ON u.active_skin_id = s.id
		WHERE role IN ('admin', 'superadmin')
		ORDER BY role DESC, tg_id ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetHallOfFame query error: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		var avatarURL *string
		err := rows.Scan(&user.TgID, &user.Username, &user.CustomName, &avatarURL, &user.Role, &user.Responsibility, &user.ActiveSkinURL)
		if err != nil {
			return nil, fmt.Errorf("GetHallOfFame scan error: %w", err)
		}
		if avatarURL != nil {
			user.AvatarURL = *avatarURL
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *userRepository) JoinSquad(ctx context.Context, tgID int64, squadID int) error {
	query := `UPDATE users SET squad_id = $1 WHERE tg_id = $2`
	_, err := r.pool.Exec(ctx, query, squadID, tgID)
	if err != nil {
		return fmt.Errorf("JoinSquad exec error: %w", err)
	}
	return nil
}

func (r *userRepository) UpdateSleepUntil(ctx context.Context, tgID int64, sleepUntil *time.Time) error {
	query := `UPDATE users SET sleep_until = $1 WHERE tg_id = $2`
	_, err := r.pool.Exec(ctx, query, sleepUntil, tgID)
	if err != nil {
		return fmt.Errorf("UpdateSleepUntil exec error: %w", err)
	}
	return nil
}

func (r *userRepository) TipUser(ctx context.Context, senderID, receiverID int64, amount float64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Lock users in consistent order to prevent deadlocks
	firstID, secondID := senderID, receiverID
	if firstID > secondID {
		firstID, secondID = secondID, firstID
	}

	// First lock
	var dummy int
	err = tx.QueryRow(ctx, "SELECT 1 FROM users WHERE tg_id = $1 FOR UPDATE", firstID).Scan(&dummy)
	if err != nil {
		return fmt.Errorf("failed to lock user %d: %w", firstID, err)
	}

	// Second lock
	err = tx.QueryRow(ctx, "SELECT 1 FROM users WHERE tg_id = $1 FOR UPDATE", secondID).Scan(&dummy)
	if err != nil {
		return fmt.Errorf("failed to lock user %d: %w", secondID, err)
	}

	// Check sender balance
	var senderBalance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1", senderID).Scan(&senderBalance)
	if err != nil {
		return fmt.Errorf("failed to fetch sender balance: %w", err)
	}

	if senderBalance < amount {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct from sender
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", amount, senderID)
	if err != nil {
		return fmt.Errorf("failed to deduct from sender: %w", err)
	}

	// Add to receiver
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", amount, receiverID)
	if err != nil {
		return fmt.Errorf("failed to add to receiver: %w", err)
	}

	// Record transaction
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES ($1, $2, $3, 'tip')", senderID, receiverID, amount)
	if err != nil {
		return fmt.Errorf("failed to insert transaction: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *userRepository) BonusDrop(ctx context.Context, adminID, targetID int64, amount float64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Update balance
	res, err := tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", amount, targetID)
	if err != nil {
		return fmt.Errorf("failed to drop bonus: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	// Transaction log
	_, err = tx.Exec(ctx, "INSERT INTO transactions (receiver_id, amount, type) VALUES ($1, $2, 'admin_bonus')", targetID, amount)
	if err != nil {
		return fmt.Errorf("failed to insert transaction log: %w", err)
	}

	// Admin log
	details := fmt.Sprintf("Granted %f coins", amount)
	_, err = tx.Exec(ctx, "INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES ($1, 'bonus_drop', $2, $3)", adminID, targetID, details)
	if err != nil {
		return fmt.Errorf("failed to write admin log: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *userRepository) UpdateUserRoleAndPermissions(ctx context.Context, adminID, targetID int64, newRole string, permissions []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if permissions == nil {
		permissions = []string{}
	}

	res, err := tx.Exec(ctx, "UPDATE users SET role = $1, permissions = $2 WHERE tg_id = $3", newRole, permissions, targetID)
	if err != nil {
		return fmt.Errorf("failed to update role: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	// Admin log
	details := fmt.Sprintf("Changed role to %s with permissions %v", newRole, permissions)
	_, err = tx.Exec(ctx, "INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES ($1, 'update_role', $2, $3)", adminID, targetID, details)
	if err != nil {
		return fmt.Errorf("failed to write admin log: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *userRepository) GenerateAdminInvite(ctx context.Context, adminID int64, role string) (string, error) {
	var token string
	err := r.pool.QueryRow(ctx, "SELECT gen_random_uuid()").Scan(&token)
	if err != nil {
		return "", fmt.Errorf("failed to generate uuid: %w", err)
	}

	_, err = r.pool.Exec(ctx, "INSERT INTO admin_invites (token, role) VALUES ($1, $2)", token, role)
	if err != nil {
		return "", fmt.Errorf("failed to insert invite: %w", err)
	}

	details := fmt.Sprintf("Generated invite for role %s", role)
	_, _ = r.pool.Exec(ctx, "INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, 'generate_invite', $2)", adminID, details)

	return token, nil
}

func (r *userRepository) AcceptAdminInvite(ctx context.Context, token string, tgID int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var inviteID int
	var role string
	err = tx.QueryRow(ctx, "SELECT id, role FROM admin_invites WHERE token = $1 AND is_used = FALSE FOR UPDATE", token).Scan(&inviteID, &role)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("invalid or used token")
		}
		return fmt.Errorf("failed to query invite: %w", err)
	}

	_, err = tx.Exec(ctx, "UPDATE admin_invites SET is_used = TRUE WHERE id = $1", inviteID)
	if err != nil {
		return fmt.Errorf("failed to update invite: %w", err)
	}

	var exists bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM users WHERE tg_id = $1", tgID).Scan(&exists)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("failed to check existing user: %w", err)
	}

	if !exists {
		query := `
			INSERT INTO users (tg_id, username, role, balance, energy, max_energy, passive_income, is_hidden, is_anonymous_tips)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err = tx.Exec(ctx, query,
			tgID, "invited_admin", role, 0, 1000, 1000, 0, false, false)
		if err != nil {
			return fmt.Errorf("insert user exec error: %w", err)
		}
	} else {
		_, err = tx.Exec(ctx, "UPDATE users SET role = $1 WHERE tg_id = $2", role, tgID)
		if err != nil {
			return fmt.Errorf("failed to update user role: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *userRepository) BanUser(ctx context.Context, tgID int64, isBanned bool, reason string) error {
	var reasonPtr *string
	if isBanned && reason != "" {
		reasonPtr = &reason
	}
	_, err := r.pool.Exec(ctx, "UPDATE users SET is_banned = $1, ban_reason = $2 WHERE tg_id = $3", isBanned, reasonPtr, tgID)
	return err
}
