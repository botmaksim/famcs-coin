package repository

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestFeedbackRepository_GetFeedbacks(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewFeedbackRepository(mock)
	now := time.Now()

	rows := mock.NewRows([]string{"id", "user_id", "username", "first_name", "text", "status", "created_at"}).
		AddRow(1, int64(123), "testuser", "Test Name", "Good app", "new", now)

	mock.ExpectQuery("^SELECT f.id, f.user_id, u.username, COALESCE\\(u.first_name, ''\\), f.text, f.status, f.created_at").
		WillReturnRows(rows)

	feedbacks, err := repo.GetFeedbacks(context.Background())
	assert.NoError(t, err)
	assert.Len(t, feedbacks, 1)
	assert.Equal(t, "Good app", feedbacks[0].Text)
}

func TestFeedbackRepository_CreateFeedback(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewFeedbackRepository(mock)

	mock.ExpectExec("^INSERT INTO feedbacks \\(user_id, text\\) VALUES \\(\\$1, \\$2\\)$").
		WithArgs(int64(123), "Great!").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.CreateFeedback(context.Background(), 123, "Great!")
	assert.NoError(t, err)
}

func TestFeedbackRepository_UpdateStatus(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewFeedbackRepository(mock)

	mock.ExpectExec("^UPDATE feedbacks SET status = \\$1 WHERE id = \\$2$").
		WithArgs("reviewed", 1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err = repo.UpdateStatus(context.Background(), 1, "reviewed")
	assert.NoError(t, err)
}
