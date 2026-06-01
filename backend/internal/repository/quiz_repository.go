package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type QuizRepository interface {
	GetTodayQuiz(ctx context.Context, tgID int64) (*models.Quiz, error)
	SubmitAnswer(ctx context.Context, tgID int64, answer string) (bool, float64, error)
}

type quizRepository struct {
	pool *pgxpool.Pool
}

func NewQuizRepository(pool *pgxpool.Pool) QuizRepository {
	return &quizRepository{pool: pool}
}

func (r *quizRepository) GetTodayQuiz(ctx context.Context, tgID int64) (*models.Quiz, error) {
	query := `
		SELECT q.id, q.question, q.reward, q.active_date, 
		       (uq.user_id IS NOT NULL) as has_attempted,
		       COALESCE(uq.is_correct, false) as is_correct
		FROM quizzes q
		LEFT JOIN user_quizzes uq ON q.active_date = uq.quiz_date AND uq.user_id = $1
		WHERE q.active_date = CURRENT_DATE
	`
	q := &models.Quiz{}
	err := r.pool.QueryRow(ctx, query, tgID).Scan(
		&q.ID, &q.Question, &q.Reward, &q.ActiveDate,
		&q.HasAttempted, &q.IsCorrect,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // No quiz for today
		}
		return nil, fmt.Errorf("failed to fetch today's quiz: %w", err)
	}

	return q, nil
}

func (r *quizRepository) SubmitAnswer(ctx context.Context, tgID int64, answer string) (bool, float64, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return false, 0, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Lock user
	var userBalance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&userBalance)
	if err != nil {
		return false, 0, fmt.Errorf("failed to lock user: %w", err)
	}

	// 2. Fetch today's quiz and the correct answer
	var quizID int
	var correctAnswer string
	var reward float64
	err = tx.QueryRow(ctx, "SELECT id, answer, reward FROM quizzes WHERE active_date = CURRENT_DATE").Scan(&quizID, &correctAnswer, &reward)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, 0, fmt.Errorf("no active quiz today")
		}
		return false, 0, fmt.Errorf("failed to fetch active quiz: %w", err)
	}

	// 3. Check if attempt already exists
	var exists bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM user_quizzes WHERE user_id = $1 AND quiz_date = CURRENT_DATE FOR UPDATE", tgID).Scan(&exists)
	if err != nil && err != pgx.ErrNoRows {
		return false, 0, fmt.Errorf("failed to check existing attempt: %w", err)
	}
	if err == nil {
		return false, 0, fmt.Errorf("already attempted")
	}

	// 4. Verify answer
	isCorrect := (answer == correctAnswer)

	// 5. Insert attempt
	_, err = tx.Exec(ctx, "INSERT INTO user_quizzes (user_id, quiz_date, is_correct) VALUES ($1, CURRENT_DATE, $2)", tgID, isCorrect)
	if err != nil {
		return false, 0, fmt.Errorf("failed to insert attempt: %w", err)
	}

	// 6. Reward if correct
	newBalance := userBalance
	if isCorrect {
		newBalance += reward
		_, err = tx.Exec(ctx, "UPDATE users SET balance = $1 WHERE tg_id = $2", newBalance, tgID)
		if err != nil {
			return false, 0, fmt.Errorf("failed to update user balance: %w", err)
		}

		_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, amount, type) VALUES ($1, $2, 'quiz_reward')", tgID, reward)
		if err != nil {
			return false, 0, fmt.Errorf("failed to insert transaction: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return false, 0, fmt.Errorf("tx commit failed: %w", err)
	}

	return isCorrect, newBalance, nil
}
