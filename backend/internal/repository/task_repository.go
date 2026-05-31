package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepository interface {
	GetTasks(ctx context.Context, tgID int64) ([]*models.Task, error)
	ClaimTaskReward(ctx context.Context, tgID int64, taskID int) (float64, error)
}

type taskRepository struct {
	pool *pgxpool.Pool
}

func NewTaskRepository(pool *pgxpool.Pool) TaskRepository {
	return &taskRepository{pool: pool}
}

func (r *taskRepository) GetTasks(ctx context.Context, tgID int64) ([]*models.Task, error) {
	query := `
		SELECT 
			t.id, t.title, t.description, t.reward_coins, t.link_url,
			(ut.task_id IS NOT NULL) as is_completed
		FROM tasks t
		LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = $1
		ORDER BY t.id ASC
	`
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("GetTasks query error: %w", err)
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		t := &models.Task{}
		err := rows.Scan(
			&t.ID, &t.Title, &t.Description, &t.RewardCoins, &t.LinkURL, &t.IsCompleted,
		)
		if err != nil {
			return nil, fmt.Errorf("GetTasks scan error: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (r *taskRepository) ClaimTaskReward(ctx context.Context, tgID int64, taskID int) (float64, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check if already completed
	var completed bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM user_tasks WHERE user_id = $1 AND task_id = $2 FOR UPDATE", tgID, taskID).Scan(&completed)
	if err != nil && err != pgx.ErrNoRows {
		return 0, fmt.Errorf("failed to check existing task completion: %w", err)
	}
	if err == nil {
		return 0, fmt.Errorf("already completed")
	}

	// Get reward amount
	var reward float64
	err = tx.QueryRow(ctx, "SELECT reward_coins FROM tasks WHERE id = $1", taskID).Scan(&reward)
	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, fmt.Errorf("task not found")
		}
		return 0, fmt.Errorf("failed to fetch task reward: %w", err)
	}

	// Insert into user_tasks
	_, err = tx.Exec(ctx, "INSERT INTO user_tasks (user_id, task_id) VALUES ($1, $2)", tgID, taskID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert user_task: %w", err)
	}

	// Update user balance and get new balance
	var newBalance float64
	err = tx.QueryRow(ctx, "UPDATE users SET balance = balance + $1 WHERE tg_id = $2 RETURNING balance", reward, tgID).Scan(&newBalance)
	if err != nil {
		return 0, fmt.Errorf("failed to update user balance: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("tx commit failed: %w", err)
	}

	return newBalance, nil
}
