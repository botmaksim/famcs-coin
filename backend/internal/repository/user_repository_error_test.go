package repository

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_GetLeaderboard_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectQuery("SELECT u.tg_id.*").
		WithArgs(10).
		WillReturnError(errors.New("db err"))
	_, err := repo.GetLeaderboard(context.Background(), 10, "balance", "all")
	assert.Error(t, err)

	mock.ExpectQuery("SELECT u.tg_id.*").
		WithArgs(10).
		WillReturnRows(mock.NewRows([]string{"tg_id", "username"}).AddRow(int64(1), "test"))
	users, err := repo.GetLeaderboard(context.Background(), 10, "balance", "all")
	assert.NoError(t, err)
	assert.Len(t, users, 0)
}

func TestUserRepository_UpdateBalance_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectBegin()
	tx, _ := mock.Begin(context.Background())
	mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnError(errors.New("update err"))
	err := repo.UpdateBalance(context.Background(), tx, 1, 10.0, "bonus")
	assert.Error(t, err)

	mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnError(errors.New("update err"))
	err = repo.UpdateBalance(context.Background(), nil, 1, 10.0, "bonus")
	assert.Error(t, err)
}

func TestUserRepository_ProcessClick_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewUserRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("begin err"))
		err := repo.ProcessClick(context.Background(), 1, 1.0, 1)
		assert.Error(t, err)
	})
	
	t.Run("query err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewUserRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT energy").WithArgs(int64(1)).WillReturnError(errors.New("select err"))
		mock.ExpectRollback()
		err := repo.ProcessClick(context.Background(), 1, 1.0, 1)
		assert.Error(t, err)
	})

	t.Run("insufficient energy", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewUserRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT energy").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"energy"}).AddRow(0))
		mock.ExpectRollback()
		err := repo.ProcessClick(context.Background(), 1, 1.0, 10)
		assert.Error(t, err)
		assert.Equal(t, "insufficient energy", err.Error())
	})

	t.Run("update err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewUserRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT energy").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"energy"}).AddRow(100))
		mock.ExpectExec("UPDATE users").WithArgs(1.0, 1, int64(1)).WillReturnError(errors.New("update err"))
		mock.ExpectRollback()
		err := repo.ProcessClick(context.Background(), 1, 1.0, 1)
		assert.Error(t, err)
	})

	t.Run("insert err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewUserRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT energy").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"energy"}).AddRow(100))
		mock.ExpectExec("UPDATE users").WithArgs(1.0, 1, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 1.0).WillReturnError(errors.New("insert err"))
		mock.ExpectRollback()
		err := repo.ProcessClick(context.Background(), 1, 1.0, 1)
		assert.Error(t, err)
	})
}

func TestUserRepository_GetUserByID_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectQuery("SELECT tg_id").
		WithArgs(int64(1)).
		WillReturnError(pgx.ErrNoRows)

	u, err := repo.GetUserByID(context.Background(), 1)
	assert.NoError(t, err)
	assert.Nil(t, u)

	mock.ExpectQuery("SELECT tg_id").
		WithArgs(int64(2)).
		WillReturnError(errors.New("db err"))

	_, err = repo.GetUserByID(context.Background(), 2)
	assert.Error(t, err)
}

func TestUserRepository_UpdateBalance_Insert_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewUserRepository(mock)

	mock.ExpectBegin()
	tx, _ := mock.Begin(context.Background())
	mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 10.0, "bonus").WillReturnError(errors.New("insert err"))
	err := repo.UpdateBalance(context.Background(), tx, 1, 10.0, "bonus")
	assert.Error(t, err)

	mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 10.0, "bonus").WillReturnError(errors.New("insert err"))
	err = repo.UpdateBalance(context.Background(), nil, 1, 10.0, "bonus")
	assert.Error(t, err)
}
