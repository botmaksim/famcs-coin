package repository

import (
	"context"
	"testing"
	"time"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestBetRepository_GetBets(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewBetRepository(mock)
	now := time.Now()

	var winningOpt int = 0
	var optIdx int = 0
	var amt float64 = 10.0
	var payout float64 = 20.0
	rows := mock.NewRows([]string{"id", "title", "description", "optionsRaw", "status", "closes_at", "winning_option_index", "created_at", "option_index", "amount", "payout"}).
		AddRow(1, "Test", "Desc", []byte(`["A","B"]`), "open", now, &winningOpt, now, &optIdx, &amt, &payout)

	mock.ExpectQuery("^\\s*SELECT(.*)FROM bet_events").
		WithArgs(int64(1)).
		WillReturnRows(rows)

	poolsRows := mock.NewRows([]string{"option_index", "sum"}).AddRow(0, 100.0)
	mock.ExpectQuery("^SELECT option_index, SUM\\(amount\\)").
		WithArgs(1).
		WillReturnRows(poolsRows)

	bets, err := repo.GetBets(context.Background(), 1)
	assert.NoError(t, err)
	assert.Len(t, bets, 1)
	assert.Equal(t, "Test", bets[0].Title)
}

func TestBetRepository_PlaceBet_Branches(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewBetRepository(mock)

	// Case 1: Closed event
	mock.ExpectBegin()
	past := time.Now().Add(-1 * time.Hour)
	rows1 := mock.NewRows([]string{"closes_at", "status"}).AddRow(past, "open")
	mock.ExpectQuery("SELECT closes_at, status FROM bet_events WHERE id = \\$1").WithArgs(1).WillReturnRows(rows1)
	mock.ExpectRollback()

	err = repo.PlaceBet(context.Background(), 123, 1, 0, 50.0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "betting is closed")

	// Case 2: Insufficient balance
	mock.ExpectBegin()
	future := time.Now().Add(1 * time.Hour)
	rows2 := mock.NewRows([]string{"closes_at", "status"}).AddRow(future, "open")
	mock.ExpectQuery("SELECT closes_at, status FROM bet_events WHERE id = \\$1").WithArgs(2).WillReturnRows(rows2)
	rowsUser := mock.NewRows([]string{"balance"}).AddRow(10.0)
	mock.ExpectQuery("SELECT balance FROM users WHERE tg_id = \\$1 FOR UPDATE").WithArgs(int64(123)).WillReturnRows(rowsUser)
	mock.ExpectRollback()

	err = repo.PlaceBet(context.Background(), 123, 2, 0, 50.0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "insufficient balance")

	// Case 3: Different option already bet
	mock.ExpectBegin()
	rows3 := mock.NewRows([]string{"closes_at", "status"}).AddRow(future, "open")
	mock.ExpectQuery("SELECT closes_at, status FROM bet_events WHERE id = \\$1").WithArgs(3).WillReturnRows(rows3)
	rowsUser3 := mock.NewRows([]string{"balance"}).AddRow(100.0)
	mock.ExpectQuery("SELECT balance FROM users WHERE tg_id = \\$1 FOR UPDATE").WithArgs(int64(123)).WillReturnRows(rowsUser3)
	mock.ExpectExec("UPDATE users SET balance = balance - \\$1 WHERE tg_id = \\$2").WithArgs(50.0, int64(123)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
	existingBetRows := mock.NewRows([]string{"id", "option_index"}).AddRow(int64(5), 1)
	mock.ExpectQuery("SELECT id, option_index FROM user_bets WHERE event_id = \\$1 AND user_id = \\$2").WithArgs(3, int64(123)).WillReturnRows(existingBetRows)
	eventOptsRow := mock.NewRows([]string{"options"}).AddRow([]byte(`["Опция 0","Опция 1"]`))
	mock.ExpectQuery("SELECT options FROM bet_events WHERE id = \\$1").WithArgs(3).WillReturnRows(eventOptsRow)
	mock.ExpectRollback()

	err = repo.PlaceBet(context.Background(), 123, 3, 0, 50.0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "вы уже поставили на")
}

func TestBetRepository_CloseBet_Success(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()
	repo := NewBetRepository(mock)

	mock.ExpectBegin()
	mock.ExpectExec("UPDATE bet_events SET status = 'resolved', winning_option_index = \\$1 WHERE id = \\$2 AND status != 'resolved'").
		WithArgs(0, 10).WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\) FROM user_bets WHERE event_id = \\$1").
		WithArgs(10).WillReturnRows(mock.NewRows([]string{"total"}).AddRow(100.0))

	mock.ExpectQuery("SELECT COALESCE\\(SUM\\(amount\\), 0\\) FROM user_bets WHERE event_id = \\$1 AND option_index = \\$2").
		WithArgs(10, 0).WillReturnRows(mock.NewRows([]string{"winning"}).AddRow(50.0))

	winnersRows := mock.NewRows([]string{"id", "user_id", "amount"}).
		AddRow(1, int64(101), 50.0)
	mock.ExpectQuery("SELECT id, user_id, amount FROM user_bets WHERE event_id = \\$1 AND option_index = \\$2").
		WithArgs(10, 0).WillReturnRows(winnersRows)

	mock.ExpectExec("UPDATE users SET balance = balance \\+ \\$1 WHERE tg_id = \\$2").
		WithArgs(100.0, int64(101)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("UPDATE user_bets SET payout = \\$1 WHERE id = \\$2").
		WithArgs(100.0, 1).WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("INSERT INTO transactions \\(user_id, amount, type\\) VALUES \\(\\$1, \\$2, 'bet_payout'\\)").
		WithArgs(int64(101), 100.0).WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectExec("UPDATE user_bets SET payout = 0 WHERE event_id = \\$1 AND option_index != \\$2").
		WithArgs(10, 0).WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectCommit()

	err = repo.CloseBet(context.Background(), 10, 0)
	assert.NoError(t, err)
}

