package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BetRepository interface {
	GetActiveEvents(ctx context.Context, tgID int64) ([]*models.BetEvent, error)
	PlaceBet(ctx context.Context, tgID int64, eventID int, chosenOption string, amount float64) error
	ResolveEvent(ctx context.Context, adminID int64, eventID int, winningOption string) error
}

type betRepository struct {
	pool *pgxpool.Pool
}

func NewBetRepository(pool *pgxpool.Pool) BetRepository {
	return &betRepository{pool: pool}
}

func (r *betRepository) GetActiveEvents(ctx context.Context, tgID int64) ([]*models.BetEvent, error) {
	// Need to get all active events ('open' or 'closed' recently, but for now just 'open' and maybe 'closed' to show history)
	// We will show 'open' and 'closed' events.
	query := `
		SELECT 
			e.id, e.title, e.option_a_name, e.option_b_name, e.status, e.winning_option, e.created_at,
			COALESCE(SUM(CASE WHEN ub.chosen_option = 'A' THEN ub.amount ELSE 0 END), 0) AS pool_a,
			COALESCE(SUM(CASE WHEN ub.chosen_option = 'B' THEN ub.amount ELSE 0 END), 0) AS pool_b,
			(SELECT chosen_option FROM user_bets WHERE user_id = $1 AND event_id = e.id LIMIT 1) AS user_bet_option,
			(SELECT amount FROM user_bets WHERE user_id = $1 AND event_id = e.id LIMIT 1) AS user_bet_amount
		FROM bet_events e
		LEFT JOIN user_bets ub ON e.id = ub.event_id
		WHERE e.status = 'open' OR e.status = 'closed'
		GROUP BY e.id
		ORDER BY e.status DESC, e.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("GetActiveEvents query error: %w", err)
	}
	defer rows.Close()

	var events []*models.BetEvent
	for rows.Next() {
		ev := &models.BetEvent{}
		err := rows.Scan(
			&ev.ID, &ev.Title, &ev.OptionAName, &ev.OptionBName, &ev.Status, &ev.WinningOption, &ev.CreatedAt,
			&ev.PoolA, &ev.PoolB, &ev.UserBetOption, &ev.UserBetAmount,
		)
		if err != nil {
			return nil, fmt.Errorf("GetActiveEvents scan error: %w", err)
		}
		events = append(events, ev)
	}
	return events, nil
}

func (r *betRepository) PlaceBet(ctx context.Context, tgID int64, eventID int, chosenOption string, amount float64) error {
	if chosenOption != "A" && chosenOption != "B" {
		return fmt.Errorf("invalid option")
	}
	if amount <= 0 {
		return fmt.Errorf("invalid amount")
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check event status
	var status string
	err = tx.QueryRow(ctx, "SELECT status FROM bet_events WHERE id = $1 FOR UPDATE", eventID).Scan(&status)
	if err != nil {
		return fmt.Errorf("event not found or lock failed: %w", err)
	}
	if status != "open" {
		return fmt.Errorf("event is not open for betting")
	}

	// Check if already bet
	var exists bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM user_bets WHERE user_id = $1 AND event_id = $2", tgID, eventID).Scan(&exists)
	if err == nil && exists {
		return fmt.Errorf("you have already placed a bet on this event")
	}

	// Lock user
	var balance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&balance)
	if err != nil {
		return fmt.Errorf("failed to lock user: %w", err)
	}
	if balance < amount {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct balance
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", amount, tgID)
	if err != nil {
		return fmt.Errorf("failed to update user balance: %w", err)
	}

	// Insert bet
	_, err = tx.Exec(ctx, "INSERT INTO user_bets (user_id, event_id, chosen_option, amount) VALUES ($1, $2, $3, $4)", tgID, eventID, chosenOption, amount)
	if err != nil {
		return fmt.Errorf("failed to insert bet: %w", err)
	}

	// Log transaction
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, amount, type) VALUES ($1, $2, 'bet_placed')", tgID, amount)
	if err != nil {
		return fmt.Errorf("failed to log transaction: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *betRepository) ResolveEvent(ctx context.Context, adminID int64, eventID int, winningOption string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var status string
	err = tx.QueryRow(ctx, "SELECT status FROM bet_events WHERE id = $1 FOR UPDATE", eventID).Scan(&status)
	if err != nil {
		return fmt.Errorf("event not found: %w", err)
	}
	if status != "open" {
		return fmt.Errorf("event is already closed or canceled")
	}

	if winningOption == "cancel" {
		_, err = tx.Exec(ctx, "UPDATE bet_events SET status = 'canceled' WHERE id = $1", eventID)
		if err != nil {
			return err
		}

		// Refund everyone
		rows, err := tx.Query(ctx, "SELECT user_id, amount FROM user_bets WHERE event_id = $1", eventID)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var uid int64
			var amt float64
			if err := rows.Scan(&uid, &amt); err != nil {
				return err
			}
			_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", amt, uid)
			if err != nil {
				return err
			}
			_, err = tx.Exec(ctx, "INSERT INTO transactions (receiver_id, amount, type) VALUES ($1, $2, 'bet_refund')", uid, amt)
			if err != nil {
				return err
			}
		}
		
		_, err = tx.Exec(ctx, "INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, 'resolve_bet', $2)", adminID, fmt.Sprintf("Canceled event %d", eventID))
		if err != nil {
			return err
		}
		return tx.Commit(ctx)
	}

	if winningOption != "A" && winningOption != "B" {
		return fmt.Errorf("invalid winning option, must be A, B, or cancel")
	}

	// Calculate pools
	var poolWin, poolLose float64
	err = tx.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM user_bets WHERE event_id = $1 AND chosen_option = $2", eventID, winningOption).Scan(&poolWin)
	if err != nil {
		return err
	}
	var losingOption string
	if winningOption == "A" {
		losingOption = "B"
	} else {
		losingOption = "A"
	}
	err = tx.QueryRow(ctx, "SELECT COALESCE(SUM(amount), 0) FROM user_bets WHERE event_id = $1 AND chosen_option = $2", eventID, losingOption).Scan(&poolLose)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, "UPDATE bet_events SET status = 'closed', winning_option = $1 WHERE id = $2", winningOption, eventID)
	if err != nil {
		return err
	}

	if poolWin > 0 {
		// Distribute poolLose proportionally to winners
		rows, err := tx.Query(ctx, "SELECT user_id, amount FROM user_bets WHERE event_id = $1 AND chosen_option = $2", eventID, winningOption)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var uid int64
			var betAmt float64
			if err := rows.Scan(&uid, &betAmt); err != nil {
				return err
			}
			
			// winAmount = original bet + (proportion of losing pool)
			proportion := betAmt / poolWin
			profit := poolLose * proportion
			totalWin := betAmt + profit

			_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2", totalWin, uid)
			if err != nil {
				return err
			}
			_, err = tx.Exec(ctx, "INSERT INTO transactions (receiver_id, amount, type) VALUES ($1, $2, 'bet_win')", uid, totalWin)
			if err != nil {
				return err
			}
		}
	} // If poolWin == 0, nobody won, losing pool is just burned (or stays in the system).

	_, err = tx.Exec(ctx, "INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, 'resolve_bet', $2)", adminID, fmt.Sprintf("Resolved event %d with option %s", eventID, winningOption))
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
