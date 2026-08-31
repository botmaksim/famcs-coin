package repository

import (
	"context"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FeedbackRepository interface {
	GetFeedbacks(ctx context.Context) ([]models.Feedback, error)
	CreateFeedback(ctx context.Context, userID int64, text string) error
	UpdateStatus(ctx context.Context, id int, status string) error
}

type feedbackRepository struct {
	db *pgxpool.Pool
}

func NewFeedbackRepository(db *pgxpool.Pool) FeedbackRepository {
	return &feedbackRepository{db: db}
}

func (r *feedbackRepository) GetFeedbacks(ctx context.Context) ([]models.Feedback, error) {
	query := `SELECT id, user_id, text, status, created_at FROM feedbacks ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []models.Feedback
	for rows.Next() {
		var f models.Feedback
		if err := rows.Scan(&f.ID, &f.UserID, &f.Text, &f.Status, &f.CreatedAt); err == nil {
			feedbacks = append(feedbacks, f)
		}
	}
	return feedbacks, nil
}

func (r *feedbackRepository) CreateFeedback(ctx context.Context, userID int64, text string) error {
	_, err := r.db.Exec(ctx, `INSERT INTO feedbacks (user_id, text) VALUES ($1, $2)`, userID, text)
	return err
}

func (r *feedbackRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	_, err := r.db.Exec(ctx, `UPDATE feedbacks SET status = $1 WHERE id = $2`, status, id)
	return err
}
