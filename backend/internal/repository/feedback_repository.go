package repository

import (
	"context"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	)

type FeedbackRepository interface {
	GetFeedbacks(ctx context.Context) ([]models.Feedback, error)
	CreateFeedback(ctx context.Context, userID int64, text string) error
	UpdateStatus(ctx context.Context, id int, status string) error
	DeleteFeedback(ctx context.Context, id int) error
}

type feedbackRepository struct {
	db db.PgxPoolIface
}

func NewFeedbackRepository(db db.PgxPoolIface) FeedbackRepository {
	return &feedbackRepository{db: db}
}

func (r *feedbackRepository) GetFeedbacks(ctx context.Context) ([]models.Feedback, error) {
	query := `
		SELECT f.id, f.user_id, u.username, COALESCE(u.first_name, ''), f.text, f.status, f.created_at 
		FROM feedbacks f
		JOIN users u ON f.user_id = u.tg_id
		ORDER BY f.created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	feedbacks := []models.Feedback{}
	for rows.Next() {
		var f models.Feedback
		if err := rows.Scan(&f.ID, &f.UserID, &f.Username, &f.FirstName, &f.Text, &f.Status, &f.CreatedAt); err == nil {
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

func (r *feedbackRepository) DeleteFeedback(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM feedbacks WHERE id = $1`, id)
	return err
}
