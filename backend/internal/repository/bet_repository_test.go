package repository

import (
	"context"
	"testing"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestBetRepository_CreateBet(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewBetRepository(mock)
	now := time.Now()

	event := &models.BetEvent{
		Title:       "Test",
		Description: "Desc",
		Options:     []string{"A", "B"},
		ClosesAt:    now,
	}

	mock.ExpectExec("^INSERT INTO bet_events").
		WithArgs("Test", "Desc", []byte(`["A","B"]`), now).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.CreateBet(context.Background(), event)
	assert.NoError(t, err)
}

func TestBetRepository_PlaceBet(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewBetRepository(mock)

	mock.ExpectBegin()

	// Check status
	mock.ExpectQuery("^SELECT closes_at, status FROM bet_events WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"closes_at", "status"}).AddRow(time.Now().Add(1*time.Hour), "open"))

	// Lock user
	mock.ExpectQuery("^SELECT balance FROM users WHERE tg_id = \\$1 FOR UPDATE$").
		WithArgs(int64(123)).
		WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))

	// Update user
	mock.ExpectExec("^UPDATE users SET balance = balance - \\$1 WHERE tg_id = \\$2$").
		WithArgs(10.0, int64(123)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// Insert user bet
	mock.ExpectExec("^INSERT INTO user_bets").
		WithArgs(1, int64(123), 0, 10.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	// Insert tx
	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(123), -10.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectCommit()

	err = repo.PlaceBet(context.Background(), 123, 1, 0, 10.0)
	assert.NoError(t, err)
}

func TestBetRepository_CloseBet(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewBetRepository(mock)

	mock.ExpectBegin()

	mock.ExpectExec("^UPDATE bet_events SET status = 'resolved', winning_option_index = \\$1 WHERE id = \\$2 AND status != 'resolved'$").
		WithArgs(0, 1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectQuery("^SELECT COALESCE\\(SUM\\(amount\\), 0\\) FROM user_bets WHERE event_id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(200.0))

	mock.ExpectQuery("^SELECT COALESCE\\(SUM\\(amount\\), 0\\) FROM user_bets WHERE event_id = \\$1 AND option_index = \\$2$").
		WithArgs(1, 0).
		WillReturnRows(mock.NewRows([]string{"sum"}).AddRow(100.0))

	// Winners loop
	mock.ExpectQuery("^SELECT id, user_id, amount FROM user_bets WHERE event_id = \\$1 AND option_index = \\$2$").
		WithArgs(1, 0).
		WillReturnRows(mock.NewRows([]string{"id", "user_id", "amount"}).AddRow(10, int64(123), 50.0))

	// Distribute
	mock.ExpectExec("^UPDATE users SET balance = balance \\+ \\$1 WHERE tg_id = \\$2$").
		WithArgs(100.0, int64(123)). // payout = 50 / 100 * 200 = 100
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^UPDATE user_bets SET payout = \\$1 WHERE id = \\$2$").
		WithArgs(100.0, 10).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(123), 100.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectExec("^UPDATE user_bets SET payout = 0 WHERE event_id = \\$1 AND option_index != \\$2$").
		WithArgs(1, 0).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectCommit()

	err = repo.CloseBet(context.Background(), 1, 0)
	assert.NoError(t, err)
}
