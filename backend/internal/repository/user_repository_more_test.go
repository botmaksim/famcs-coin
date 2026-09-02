package repository

import (
	"context"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_GetLeaderboard(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)

	rows := mock.NewRows([]string{"tg_id", "username", "custom_name", "avatar_url", "balance", "passive_income", "bets_won", "bets_profit"}).
		AddRow(int64(1), "user1", nil, nil, 100.0, 50.0, 5, 20.0)

	mock.ExpectQuery("SELECT u.tg_id.*").
		WithArgs(10).
		WillReturnRows(rows)

	users, err := repo.GetLeaderboard(context.Background(), 10, "balance", "all")
	assert.NoError(t, err)
	assert.Len(t, users, 1)
}

func TestUserRepository_UpdateBalance(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectBegin()
	mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 10.0, "test").WillReturnResult(pgxmock.NewResult("INSERT", 1))

	tx, _ := mock.Begin(context.Background())
	err = repo.UpdateBalance(context.Background(), tx, 1, 10.0, "test")
	assert.NoError(t, err)
}
