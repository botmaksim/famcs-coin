package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SquadRepository interface {
	GetSquads(ctx context.Context) ([]*models.Squad, error)
	GetTopSquads(ctx context.Context, limit int) ([]*models.Squad, error)
	GetSquadByID(ctx context.Context, id int) (*models.Squad, error)
	CreateSquadWithTx(ctx context.Context, tgID int64, name string, price float64) (int, error)
	DonateToSquad(ctx context.Context, tgID int64, amount float64) error
	ActivateSquadBoost(ctx context.Context, tgID int64) error
}

type squadRepository struct {
	pool *pgxpool.Pool
}

func NewSquadRepository(pool *pgxpool.Pool) SquadRepository {
	return &squadRepository{pool: pool}
}

func (r *squadRepository) GetSquads(ctx context.Context) ([]*models.Squad, error) {
	query := `
		SELECT id, name, total_points, treasury_balance, boost_until
		FROM squads
		ORDER BY total_points DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetSquads query error: %w", err)
	}
	defer rows.Close()

	var squads []*models.Squad
	for rows.Next() {
		squad := &models.Squad{}
		err := rows.Scan(
			&squad.ID, &squad.Name, &squad.TotalPoints, &squad.TreasuryBalance, &squad.BoostUntil,
		)
		if err != nil {
			return nil, fmt.Errorf("GetSquads scan error: %w", err)
		}
		squads = append(squads, squad)
	}
	return squads, nil
}

func (r *squadRepository) GetTopSquads(ctx context.Context, limit int) ([]*models.Squad, error) {
	query := `
		SELECT id, name, total_points, treasury_balance, boost_until
		FROM squads
		ORDER BY total_points DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("GetTopSquads query error: %w", err)
	}
	defer rows.Close()

	var squads []*models.Squad
	for rows.Next() {
		squad := &models.Squad{}
		err := rows.Scan(
			&squad.ID, &squad.Name, &squad.TotalPoints, &squad.TreasuryBalance, &squad.BoostUntil,
		)
		if err != nil {
			return nil, fmt.Errorf("GetTopSquads scan error: %w", err)
		}
		squads = append(squads, squad)
	}
	return squads, nil
}

func (r *squadRepository) GetSquadByID(ctx context.Context, id int) (*models.Squad, error) {
	query := `
		SELECT id, name, total_points, treasury_balance, boost_until
		FROM squads
		WHERE id = $1
	`
	squad := &models.Squad{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&squad.ID, &squad.Name, &squad.TotalPoints, &squad.TreasuryBalance, &squad.BoostUntil,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("GetSquadByID query error: %w", err)
	}
	return squad, nil
}

func (r *squadRepository) CreateSquadWithTx(ctx context.Context, tgID int64, name string, price float64) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Блокируем пользователя и проверяем баланс
	var currentBalance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&currentBalance)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch user for update: %w", err)
	}

	if currentBalance < price {
		return 0, fmt.Errorf("insufficient funds")
	}

	// Списываем средства
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", price, tgID)
	if err != nil {
		return 0, fmt.Errorf("failed to deduct balance: %w", err)
	}

	// Создаем сквад
	var newSquadID int
	err = tx.QueryRow(ctx, "INSERT INTO squads (name) VALUES ($1) RETURNING id", name).Scan(&newSquadID)
	if err != nil {
		return 0, fmt.Errorf("failed to create squad: %w", err)
	}

	// Обновляем squad_id пользователя (привязываем его к созданной группе)
	_, err = tx.Exec(ctx, "UPDATE users SET squad_id = $1 WHERE tg_id = $2", newSquadID, tgID)
	if err != nil {
		return 0, fmt.Errorf("failed to assign user to new squad: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("tx commit failed: %w", err)
	}

	return newSquadID, nil
}

func (r *squadRepository) DonateToSquad(ctx context.Context, tgID int64, amount float64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Блокируем юзера
	var balance float64
	var squadID *int
	err = tx.QueryRow(ctx, "SELECT balance, squad_id FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&balance, &squadID)
	if err != nil {
		return fmt.Errorf("failed to fetch user: %w", err)
	}
	if squadID == nil {
		return fmt.Errorf("user is not in a squad")
	}
	if balance < amount {
		return fmt.Errorf("insufficient balance")
	}

	// Списываем
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", amount, tgID)
	if err != nil {
		return fmt.Errorf("failed to deduct balance: %w", err)
	}

	// Зачисляем в казну
	_, err = tx.Exec(ctx, "UPDATE squads SET treasury_balance = treasury_balance + $1 WHERE id = $2", amount, *squadID)
	if err != nil {
		return fmt.Errorf("failed to add to treasury: %w", err)
	}

	// Транзакция
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, squad_id, amount, type) VALUES ($1, $2, $3, 'squad_donation')", tgID, *squadID, amount)
	if err != nil {
		return fmt.Errorf("failed to insert transaction log: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *squadRepository) ActivateSquadBoost(ctx context.Context, tgID int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Получаем squad_id юзера
	var squadID *int
	err = tx.QueryRow(ctx, "SELECT squad_id FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&squadID)
	if err != nil {
		return fmt.Errorf("failed to fetch user: %w", err)
	}
	if squadID == nil {
		return fmt.Errorf("user is not in a squad")
	}

	// Блокируем сквад
	var treasury float64
	err = tx.QueryRow(ctx, "SELECT treasury_balance FROM squads WHERE id = $1 FOR UPDATE", *squadID).Scan(&treasury)
	if err != nil {
		return fmt.Errorf("failed to fetch squad: %w", err)
	}

	boostCost := 1000000.0
	if treasury < boostCost {
		return fmt.Errorf("insufficient treasury balance")
	}

	// Списываем
	_, err = tx.Exec(ctx, "UPDATE squads SET treasury_balance = treasury_balance - $1, boost_until = NOW() + INTERVAL '24 hours' WHERE id = $2", boostCost, *squadID)
	if err != nil {
		return fmt.Errorf("failed to activate boost: %w", err)
	}

	return tx.Commit(ctx)
}
