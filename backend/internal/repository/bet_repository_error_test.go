package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestBetRepository_GetBets_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewBetRepository(mock)

	mock.ExpectQuery("SELECT").WithArgs(int64(1)).WillReturnError(errors.New("db err"))
	_, err := repo.GetBets(context.Background(), 1)
	assert.Error(t, err)

	mock.ExpectQuery("SELECT").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"id"}).AddRow(1)) // scan error
	bets, err := repo.GetBets(context.Background(), 1)
	assert.NoError(t, err)
	assert.Len(t, bets, 0)
}

func TestBetRepository_PlaceBet_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("db err"))
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})

	t.Run("event err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})

	t.Run("closed bet", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(-1*time.Hour), "open"))
		mock.ExpectRollback()
		err := repo.PlaceBet(context.Background(), 1, 1, 1, 10.0)
		assert.Error(t, err)
		assert.Equal(t, "betting is closed for this event", err.Error())
	})

	t.Run("balance err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})

	t.Run("insufficient balance", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(0.0))
		mock.ExpectRollback()
		err := repo.PlaceBet(context.Background(), 1, 1, 1, 10.0)
		assert.Error(t, err)
		assert.Equal(t, "insufficient balance", err.Error())
	})
	
	t.Run("update balance err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})
	
	t.Run("insert bet err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO user_bets").WithArgs(1, int64(1), 1, 10.0).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})
	
	t.Run("insert tx err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT closes_at").WithArgs(1).WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO user_bets").WithArgs(1, int64(1), 1, 10.0).WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), -10.0, "bet_place").WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.PlaceBet(context.Background(), 1, 1, 1, 10.0))
	})
}

func TestBetRepository_CloseBet_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("db err"))
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})

	t.Run("update event err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectExec("UPDATE bet_events").WithArgs(1, 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})
	
	t.Run("total pool err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectExec("UPDATE bet_events").WithArgs(1, 1).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})
	
	t.Run("winning pool err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectExec("UPDATE bet_events").WithArgs(1, 1).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1).WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(100.0))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1, 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})
	
	t.Run("query winners err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectExec("UPDATE bet_events").WithArgs(1, 1).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1).WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(100.0))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1, 1).WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(10.0))
		mock.ExpectQuery("SELECT id").WithArgs(1, 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})
	
	t.Run("payout errs", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewBetRepository(mock)
		mock.ExpectBegin()
		mock.ExpectExec("UPDATE bet_events").WithArgs(1, 1).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1).WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(100.0))
		mock.ExpectQuery("SELECT COALESCE").WithArgs(1, 1).WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(10.0))
		mock.ExpectQuery("SELECT id").WithArgs(1, 1).WillReturnRows(mock.NewRows([]string{"id", "user_id", "amount"}).AddRow(1, int64(1), 10.0))
		
		// Update user balance error
		mock.ExpectExec("UPDATE users").WithArgs(100.0, int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.CloseBet(context.Background(), 1, 1))
	})
}
