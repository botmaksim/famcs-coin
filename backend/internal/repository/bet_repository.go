package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	)

type BetRepository interface {
	GetBets(ctx context.Context, userID int64) ([]models.BetEvent, error)
	CreateBet(ctx context.Context, event *models.BetEvent) error
	PlaceBet(ctx context.Context, userID int64, eventID int, optionIndex int, amount float64) error
	CloseBet(ctx context.Context, eventID int, winningOption int) error
}

type betRepository struct {
	db db.PgxPoolIface
}

func NewBetRepository(db db.PgxPoolIface) BetRepository {
	return &betRepository{db: db}
}

func (r *betRepository) GetBets(ctx context.Context, userID int64) ([]models.BetEvent, error) {
	query := `
		SELECT 
			e.id, e.title, e.description, e.options, e.status, e.closes_at, e.winning_option_index, e.created_at,
			ub.option_index, ub.amount
		FROM bet_events e
		LEFT JOIN user_bets ub ON e.id = ub.event_id AND ub.user_id = $1
		ORDER BY e.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bets := []models.BetEvent{}
	for rows.Next() {
		var b models.BetEvent
		var optionsRaw []byte
		if err := rows.Scan(&b.ID, &b.Title, &b.Description, &optionsRaw, &b.Status, &b.ClosesAt, &b.WinningOption, &b.CreatedAt, &b.UserBetOption, &b.UserBetAmount); err != nil {
			log.Println("Error scanning bet:", err)
			continue
		}
		json.Unmarshal(optionsRaw, &b.Options)
		
		// Calculate pools
		poolsQuery := `SELECT option_index, SUM(amount) FROM user_bets WHERE event_id = $1 GROUP BY option_index`
		pRows, _ := r.db.Query(ctx, poolsQuery, b.ID)
		
		b.Pools = make([]float64, len(b.Options))
		for pRows.Next() {
			var idx int
			var amount float64
			if err := pRows.Scan(&idx, &amount); err == nil && idx >= 0 && idx < len(b.Pools) {
				b.Pools[idx] = amount
			}
		}
		pRows.Close()

		bets = append(bets, b)
	}
	return bets, nil
}

func (r *betRepository) CreateBet(ctx context.Context, event *models.BetEvent) error {
	opts, _ := json.Marshal(event.Options)
	_, err := r.db.Exec(ctx, `INSERT INTO bet_events (title, description, options, closes_at) VALUES ($1, $2, $3, $4)`, event.Title, event.Description, opts, event.ClosesAt)
	return err
}

func (r *betRepository) PlaceBet(ctx context.Context, userID int64, eventID int, optionIndex int, amount float64) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var closesAt time.Time
	var status string
	err = tx.QueryRow(ctx, `SELECT closes_at, status FROM bet_events WHERE id = $1`, eventID).Scan(&closesAt, &status)
	if err != nil {
		return err
	}

	if status != "open" || time.Now().After(closesAt) {
		return fmt.Errorf("betting is closed for this event")
	}

	var balance float64
	err = tx.QueryRow(ctx, `SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE`, userID).Scan(&balance)
	if err != nil {
		return err
	}

	if balance < amount {
		return fmt.Errorf("insufficient balance")
	}

	_, err = tx.Exec(ctx, `UPDATE users SET balance = balance - $1 WHERE tg_id = $2`, amount, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `INSERT INTO user_bets (event_id, user_id, option_index, amount) VALUES ($1, $2, $3, $4)`, eventID, userID, optionIndex, amount)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'bet_place')`, userID, -amount)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *betRepository) CloseBet(ctx context.Context, eventID int, winningOption int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update event status
	_, err = tx.Exec(ctx, `UPDATE bet_events SET status = 'resolved', winning_option_index = $1 WHERE id = $2 AND status != 'resolved'`, winningOption, eventID)
	if err != nil {
		return err
	}

	// Calculate total pool and winning pool
	var totalPool float64
	var winningPool float64
	err = tx.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM user_bets WHERE event_id = $1`, eventID).Scan(&totalPool)
	if err != nil { return err }
	
	err = tx.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM user_bets WHERE event_id = $1 AND option_index = $2`, eventID, winningOption).Scan(&winningPool)
	if err != nil { return err }

	if winningPool > 0 {
		// Distribute winnings
		rows, err := tx.Query(ctx, `SELECT id, user_id, amount FROM user_bets WHERE event_id = $1 AND option_index = $2`, eventID, winningOption)
		if err != nil { return err }
		defer rows.Close()

		type Winner struct {
			BetID  int
			UserID int64
			Amount float64
		}
		var winners []Winner
		for rows.Next() {
			var w Winner
			if err := rows.Scan(&w.BetID, &w.UserID, &w.Amount); err == nil {
				winners = append(winners, w)
			}
		}
		rows.Close()

		for _, w := range winners {
			payout := (w.Amount / winningPool) * totalPool
			_, err = tx.Exec(ctx, `UPDATE users SET balance = balance + $1 WHERE tg_id = $2`, payout, w.UserID)
			if err != nil { return err }
			
			_, err = tx.Exec(ctx, `UPDATE user_bets SET payout = $1 WHERE id = $2`, payout, w.BetID)
			if err != nil { return err }

			_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'bet_payout')`, w.UserID, payout)
			if err != nil { return err }
		}
	}

	return tx.Commit(ctx)
}
