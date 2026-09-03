package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	)

type UserRepository interface {
	GetUserByID(ctx context.Context, id int64) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) error
	UpdateSettings(ctx context.Context, id int64, customName *string, isHidden bool) error
	UpdateRole(ctx context.Context, id int64, role string) error
	GetLeaderboard(ctx context.Context, limit int, sortBy string, period string) ([]models.User, error)
	UpdateBalance(ctx context.Context, tx pgx.Tx, userID int64, amount float64, txType string) error
	ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) (float64, int, error)
	SearchUsers(ctx context.Context, query string, limit int) ([]models.User, error)
}

type userRepository struct {
	db db.PgxPoolIface
}

func NewUserRepository(db db.PgxPoolIface) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	query := `SELECT tg_id, username, COALESCE(first_name, ''), custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, last_active_at, created_at FROM users WHERE tg_id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var u models.User
	err := row.Scan(&u.TgID, &u.Username, &u.FirstName, &u.CustomName, &u.AvatarURL, &u.Role, &u.Balance, &u.Energy, &u.MaxEnergy, &u.PassiveIncome, &u.IsHidden, &u.LastActiveAt, &u.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Offline energy recovery (3 energy/sec) and passive income
	if u.LastActiveAt != nil && !u.LastActiveAt.IsZero() {
		elapsed := time.Since(*u.LastActiveAt).Seconds()
		if elapsed >= 1 {
			energyRegen := int(elapsed * 3.0)
			updated := false
			if energyRegen > 0 && u.Energy < u.MaxEnergy {
				u.Energy += energyRegen
				if u.Energy > u.MaxEnergy {
					u.Energy = u.MaxEnergy
				}
				updated = true
			}
			if u.PassiveIncome > 0 {
				offlineSecs := elapsed
				if offlineSecs > 3*3600 {
					offlineSecs = 3 * 3600
				}
				incomeEarned := (offlineSecs / 3600.0) * u.PassiveIncome
				if incomeEarned > 0 {
					u.Balance += incomeEarned
					updated = true
				}
			}
			if updated {
				now := time.Now()
				u.LastActiveAt = &now
				_, _ = r.db.Exec(ctx, `UPDATE users SET balance = $1, energy = $2, last_active_at = $3 WHERE tg_id = $4`, u.Balance, u.Energy, u.LastActiveAt, u.TgID)
			}
		}
	}

	return &u, nil
}

func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	query := `INSERT INTO users (tg_id, username, first_name, avatar_url, role, balance, energy, max_energy) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			  ON CONFLICT (tg_id) DO UPDATE SET 
			  username = EXCLUDED.username, first_name = EXCLUDED.first_name, avatar_url = EXCLUDED.avatar_url, last_active_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, user.TgID, user.Username, user.FirstName, user.AvatarURL, user.Role, user.Balance, user.Energy, user.MaxEnergy)
	return err
}

func (r *userRepository) UpdateSettings(ctx context.Context, id int64, customName *string, isHidden bool) error {
	query := `UPDATE users SET custom_name = $1, is_hidden = $2 WHERE tg_id = $3`
	_, err := r.db.Exec(ctx, query, customName, isHidden, id)
	return err
}

func (r *userRepository) UpdateRole(ctx context.Context, id int64, role string) error {
	query := `UPDATE users SET role = $1 WHERE tg_id = $2`
	_, err := r.db.Exec(ctx, query, role, id)
	return err
}

func (r *userRepository) GetLeaderboard(ctx context.Context, limit int, sortBy string, period string) ([]models.User, error) {
	orderClause := "balance DESC"
	if sortBy == "income" {
		orderClause = "passive_income DESC"
	} else if sortBy == "bets_won" {
		orderClause = "bets_won DESC"
	} else if sortBy == "bets_profit" {
		orderClause = "bets_profit DESC"
	}

	periodJoin := ""
	if period == "month" {
		periodJoin = " AND ub.created_at >= NOW() - INTERVAL '1 month'"
	}

	query := fmt.Sprintf(`
		SELECT 
			u.tg_id, u.username, COALESCE(u.first_name, ''), u.custom_name, u.avatar_url, u.balance, u.passive_income,
			COUNT(CASE WHEN e.status = 'resolved' AND ub.option_index = e.winning_option_index THEN 1 END) as bets_won,
			COALESCE(SUM(CASE WHEN e.status = 'resolved' THEN COALESCE(ub.payout, 0) - ub.amount ELSE 0 END), 0) as bets_profit
		FROM users u
		LEFT JOIN user_bets ub ON u.tg_id = ub.user_id %s
		LEFT JOIN bet_events e ON ub.event_id = e.id
		WHERE u.is_hidden = FALSE
		GROUP BY u.tg_id, u.username, u.first_name, u.custom_name, u.avatar_url, u.balance, u.passive_income
		ORDER BY %s 
		LIMIT $1
	`, periodJoin, orderClause)

	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.TgID, &u.Username, &u.FirstName, &u.CustomName, &u.AvatarURL, &u.Balance, &u.PassiveIncome, &u.BetsWon, &u.BetsProfit); err != nil {
			log.Println("Error scanning leaderboard row:", err)
			continue
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *userRepository) UpdateBalance(ctx context.Context, tx pgx.Tx, userID int64, amount float64, txType string) error {
	var err error
	if tx != nil {
		_, err = tx.Exec(ctx, `UPDATE users SET balance = balance + $1 WHERE tg_id = $2`, amount, userID)
		if err == nil {
			_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)`, userID, amount, txType)
		}
	} else {
		_, err = r.db.Exec(ctx, `UPDATE users SET balance = balance + $1 WHERE tg_id = $2`, amount, userID)
		if err == nil {
			_, err = r.db.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)`, userID, amount, txType)
		}
	}
	return err
}

func (r *userRepository) ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) (float64, int, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback(ctx)

	var balance, passiveIncome float64
	var currentEnergy, maxEnergy int
	var lastActiveAt *time.Time

	err = tx.QueryRow(ctx, `SELECT balance, energy, max_energy, passive_income, last_active_at FROM users WHERE tg_id = $1 FOR UPDATE`, userID).
		Scan(&balance, &currentEnergy, &maxEnergy, &passiveIncome, &lastActiveAt)
	if err != nil {
		return 0, 0, err
	}

	// Calculate offline regeneration (3 energy per second)
	if lastActiveAt != nil && !lastActiveAt.IsZero() {
		elapsed := time.Since(*lastActiveAt).Seconds()
		if elapsed >= 1 {
			energyRegen := int(elapsed * 3.0)
			if energyRegen > 0 {
				currentEnergy += energyRegen
				if currentEnergy > maxEnergy {
					currentEnergy = maxEnergy
				}
			}
			if passiveIncome > 0 {
				offlineSecs := elapsed
				if offlineSecs > 3*3600 {
					offlineSecs = 3 * 3600
				}
				balance += (offlineSecs / 3600.0) * passiveIncome
			}
		}
	}

	actualClicks := energyCost
	if currentEnergy < actualClicks {
		actualClicks = currentEnergy
	}
	if actualClicks < 0 {
		actualClicks = 0
	}

	actualCoins := float64(actualClicks)
	balance += actualCoins
	currentEnergy -= actualClicks

	_, err = tx.Exec(ctx, `UPDATE users SET balance = $1, energy = $2, last_active_at = CURRENT_TIMESTAMP WHERE tg_id = $3`, balance, currentEnergy, userID)
	if err != nil {
		return 0, 0, err
	}

	if actualCoins > 0 {
		_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'click')`, userID, actualCoins)
		if err != nil {
			return 0, 0, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, 0, err
	}

	return balance, currentEnergy, nil
}

func (r *userRepository) SearchUsers(ctx context.Context, search string, limit int) ([]models.User, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var rows pgx.Rows
	var err error

	if search != "" {
		pattern := "%" + search + "%"
		sql := `
			SELECT tg_id, username, COALESCE(first_name, ''), custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, created_at
			FROM users
			WHERE username ILIKE $1 OR first_name ILIKE $1 OR custom_name ILIKE $1 OR CAST(tg_id AS TEXT) ILIKE $1
			ORDER BY 
				CASE role 
					WHEN 'superadmin' THEN 1 
					WHEN 'admin' THEN 2 
					ELSE 3 
				END, 
				balance DESC
			LIMIT $2
		`
		rows, err = r.db.Query(ctx, sql, pattern, limit)
	} else {
		sql := `
			SELECT tg_id, username, COALESCE(first_name, ''), custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, created_at
			FROM users
			ORDER BY 
				CASE role 
					WHEN 'superadmin' THEN 1 
					WHEN 'admin' THEN 2 
					ELSE 3 
				END, 
				balance DESC
			LIMIT $1
		`
		rows, err = r.db.Query(ctx, sql, limit)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.TgID, &u.Username, &u.FirstName, &u.CustomName, &u.AvatarURL, &u.Role, &u.Balance, &u.Energy, &u.MaxEnergy, &u.PassiveIncome, &u.IsHidden, &u.CreatedAt); err != nil {
			log.Println("Error scanning user row in SearchUsers:", err)
			continue
		}
		users = append(users, u)
	}
	return users, nil
}
