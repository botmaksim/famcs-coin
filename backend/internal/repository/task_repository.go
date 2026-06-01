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
	GetAllTasks(ctx context.Context) ([]*models.Task, error)
	CreateTask(ctx context.Context, task *models.Task) error
	UpdateTask(ctx context.Context, task *models.Task) error
	DeleteTask(ctx context.Context, taskID int) error
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

func (r *taskRepository) GetAllTasks(ctx context.Context) ([]*models.Task, error) {
	query := `
		SELECT id, title, description, reward_coins, link_url
		FROM tasks
		ORDER BY id ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetAllTasks query error: %w", err)
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		t := &models.Task{}
		err := rows.Scan(
			&t.ID, &t.Title, &t.Description, &t.RewardCoins, &t.LinkURL,
		)
		if err != nil {
			return nil, fmt.Errorf("GetAllTasks scan error: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

func (r *taskRepository) CreateTask(ctx context.Context, task *models.Task) error {
	query := `
		INSERT INTO tasks (title, description, reward_coins, link_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, task.Title, task.Description, task.RewardCoins, task.LinkURL).Scan(&task.ID)
	if err != nil {
		return fmt.Errorf("CreateTask error: %w", err)
	}
	return nil
}

func (r *taskRepository) UpdateTask(ctx context.Context, task *models.Task) error {
	query := `
		UPDATE tasks 
		SET title = $1, description = $2, reward_coins = $3, link_url = $4
		WHERE id = $5
	`
	res, err := r.pool.Exec(ctx, query, task.Title, task.Description, task.RewardCoins, task.LinkURL, task.ID)
	if err != nil {
		return fmt.Errorf("UpdateTask error: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

func (r *taskRepository) DeleteTask(ctx context.Context, taskID int) error {
	// Let's delete user_tasks first to avoid foreign key violations, assuming there is a cascade or we do it manually.
	// Actually we should just let cascade handle it, or delete manually.
	_, err := r.pool.Exec(ctx, "DELETE FROM user_tasks WHERE task_id = $1", taskID)
	if err != nil {
		return fmt.Errorf("DeleteTask user_tasks error: %w", err)
	}

	res, err := r.pool.Exec(ctx, "DELETE FROM tasks WHERE id = $1", taskID)
	if err != nil {
		return fmt.Errorf("DeleteTask error: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
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
