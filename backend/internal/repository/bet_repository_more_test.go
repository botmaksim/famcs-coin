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
	rows := mock.NewRows([]string{"id", "title", "description", "optionsRaw", "status", "closes_at", "winning_option_index", "created_at", "option_index", "amount"}).
		AddRow(1, "Test", "Desc", []byte(`["A","B"]`), "open", now, &winningOpt, now, &optIdx, &amt)

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
