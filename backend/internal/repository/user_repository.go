package repository

import (
	"context"
	"fmt"
	"log"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	)

type UserRepository interface {
	GetUserByID(ctx context.Context, id int64) (*models.User, error)
	CreateUser(ctx context.Context, user *models.User) error
	UpdateSettings(ctx context.Context, id int64, customName *string, isHidden bool) error
	UpdateRole(ctx context.Context, id int64, role string) error
	GetLeaderboard(ctx context.Context, limit int) ([]models.User, error)
	UpdateBalance(ctx context.Context, tx pgx.Tx, userID int64, amount float64, txType string) error
	ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) error
}

type userRepository struct {
	db db.PgxPoolIface
}

func NewUserRepository(db db.PgxPoolIface) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	query := `SELECT tg_id, username, custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, last_active_at, created_at FROM users WHERE tg_id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var u models.User
	err := row.Scan(&u.TgID, &u.Username, &u.CustomName, &u.AvatarURL, &u.Role, &u.Balance, &u.Energy, &u.MaxEnergy, &u.PassiveIncome, &u.IsHidden, &u.LastActiveAt, &u.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) CreateUser(ctx context.Context, user *models.User) error {
	query := `INSERT INTO users (tg_id, username, avatar_url, role, balance, energy, max_energy) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7)
			  ON CONFLICT (tg_id) DO UPDATE SET 
			  username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, last_active_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, user.TgID, user.Username, user.AvatarURL, user.Role, user.Balance, user.Energy, user.MaxEnergy)
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

func (r *userRepository) GetLeaderboard(ctx context.Context, limit int) ([]models.User, error) {
	query := `SELECT tg_id, username, custom_name, avatar_url, balance FROM users WHERE is_hidden = FALSE ORDER BY balance DESC LIMIT $1`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.TgID, &u.Username, &u.CustomName, &u.AvatarURL, &u.Balance); err != nil {
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

func (r *userRepository) ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Lock the row for update to prevent concurrent click exploits
	var currentEnergy int
	err = tx.QueryRow(ctx, `SELECT energy FROM users WHERE tg_id = $1 FOR UPDATE`, userID).Scan(&currentEnergy)
	if err != nil {
		return err
	}

	if currentEnergy < energyCost {
		return fmt.Errorf("insufficient energy")
	}

	_, err = tx.Exec(ctx, `UPDATE users SET balance = balance + $1, energy = energy - $2, last_active_at = CURRENT_TIMESTAMP WHERE tg_id = $3`, coins, energyCost, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'click')`, userID, coins)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
