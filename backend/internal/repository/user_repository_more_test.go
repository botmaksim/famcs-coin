package repository

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_GetLeaderboard(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)

	rows := mock.NewRows([]string{"tg_id", "username", "first_name", "custom_name", "avatar_url", "balance", "passive_income", "bets_won", "bets_profit"}).
		AddRow(int64(1), "user1", "User One", nil, nil, 100.0, 50.0, 5, 20.0)

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

func TestUserRepository_SearchUsers(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewUserRepository(mock)

	now := time.Now()

	// With query
	rows1 := mock.NewRows([]string{"tg_id", "username", "first_name", "custom_name", "avatar_url", "role", "balance", "energy", "max_energy", "passive_income", "is_hidden", "created_at"}).
		AddRow(int64(10), "founduser", "First", nil, nil, "user", 100.0, 500, 1000, 10.0, false, now)

	mock.ExpectQuery("SELECT tg_id, username.*WHERE username ILIKE \\$1").
		WithArgs("%search%", 20).
		WillReturnRows(rows1)

	users, err := repo.SearchUsers(context.Background(), "search", 20)
	assert.NoError(t, err)
	assert.Len(t, users, 1)

	// Without query (empty)
	rows2 := mock.NewRows([]string{"tg_id", "username", "first_name", "custom_name", "avatar_url", "role", "balance", "energy", "max_energy", "passive_income", "is_hidden", "created_at"}).
		AddRow(int64(20), "alluser", "Second", nil, nil, "admin", 200.0, 800, 1000, 20.0, false, now)

	mock.ExpectQuery("SELECT tg_id, username.*ORDER BY.*LIMIT \\$1").
		WithArgs(50).
		WillReturnRows(rows2)

	users2, err := repo.SearchUsers(context.Background(), "", 0)
	assert.NoError(t, err)
	assert.Len(t, users2, 1)
}

func TestUserRepository_GetUserByID_OfflineRegen(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewUserRepository(mock)

	past := time.Now().Add(-10 * time.Minute)
	created := time.Now().Add(-24 * time.Hour)

	rows := mock.NewRows([]string{"tg_id", "username", "first_name", "custom_name", "avatar_url", "role", "balance", "energy", "max_energy", "passive_income", "is_hidden", "last_active_at", "created_at"}).
		AddRow(int64(77), "regenuser", "Regen", nil, nil, "user", 50.0, 100, 1000, 60.0, false, &past, created)

	mock.ExpectQuery("SELECT tg_id, username.*FROM users WHERE tg_id = \\$1").
		WithArgs(int64(77)).
		WillReturnRows(rows)

	mock.ExpectExec("UPDATE users SET balance = \\$1, energy = \\$2, last_active_at = \\$3 WHERE tg_id = \\$4").
		WithArgs(pgxmock.AnyArg(), pgxmock.AnyArg(), pgxmock.AnyArg(), int64(77)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	u, err := repo.GetUserByID(context.Background(), 77)
	assert.NoError(t, err)
	assert.NotNil(t, u)
	assert.True(t, u.Energy > 100)
	assert.True(t, u.Balance > 50.0)
}

func TestUserRepository_ProcessClick(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectBegin()
	past := time.Now().Add(-5 * time.Minute)
	rows := mock.NewRows([]string{"balance", "energy", "max_energy", "passive_income", "last_active_at"}).
		AddRow(100.0, 50, 100, 120.0, &past)
	mock.ExpectQuery("SELECT balance, energy, max_energy, passive_income, last_active_at FROM users WHERE tg_id = \\$1 FOR UPDATE").
		WithArgs(int64(1)).
		WillReturnRows(rows)

	mock.ExpectExec("UPDATE users SET balance = \\$1, energy = \\$2, last_active_at = CURRENT_TIMESTAMP WHERE tg_id = \\$3").
		WithArgs(pgxmock.AnyArg(), pgxmock.AnyArg(), int64(1)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("INSERT INTO transactions \\(user_id, amount, type\\) VALUES \\(\\$1, \\$2, 'click'\\)").
		WithArgs(int64(1), pgxmock.AnyArg()).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectCommit()

	balance, energy, err := repo.ProcessClick(context.Background(), 1, 10.0, 10)
	assert.NoError(t, err)
	assert.True(t, balance > 100.0)
	assert.True(t, energy > 0)
}


