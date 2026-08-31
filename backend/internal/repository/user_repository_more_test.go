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

	rows := mock.NewRows([]string{"tg_id", "username", "custom_name", "avatar_url", "balance"}).
		AddRow(int64(1), "user1", nil, nil, 100.0)

	mock.ExpectQuery("^SELECT tg_id, username, custom_name, avatar_url, balance FROM users WHERE is_hidden = FALSE ORDER BY balance DESC LIMIT \\$1$").
		WithArgs(10).
		WillReturnRows(rows)

	users, err := repo.GetLeaderboard(context.Background(), 10)
	assert.NoError(t, err)
	assert.Len(t, users, 1)
}

func TestUserRepository_UpdateBalance(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)

	mock.ExpectExec("^UPDATE users SET balance = balance \\+ \\$1 WHERE tg_id = \\$2$").
		WithArgs(10.0, int64(1)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(1), 10.0, "bonus").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.UpdateBalance(context.Background(), nil, 1, 10.0, "bonus")
	assert.NoError(t, err)
}

func TestUserRepository_ProcessClick(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)
	mock.ExpectBegin()

	mock.ExpectQuery("^SELECT energy FROM users WHERE tg_id = \\$1 FOR UPDATE$").
		WithArgs(int64(1)).
		WillReturnRows(mock.NewRows([]string{"energy"}).AddRow(100))

	mock.ExpectExec("^UPDATE users SET balance = balance \\+ \\$1, energy = energy - \\$2").
		WithArgs(10.0, 10, int64(1)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(1), 10.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectCommit()

	err = repo.ProcessClick(context.Background(), 1, 10.0, 10)
	assert.NoError(t, err)
}
