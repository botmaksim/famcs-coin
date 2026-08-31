package repository

import (
	"context"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestShopRepository_DeleteItem(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewShopRepository(mock)
	mock.ExpectBegin()

	// SELECT uu.user_id, uu.quantity, u.base_price
	mock.ExpectQuery("^SELECT uu.user_id, uu.quantity, u.base_price FROM user_upgrades").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"user_id", "quantity", "base_price"}).AddRow(int64(1), 2, 10.0))

	// UPDATE user balance
	mock.ExpectExec("^UPDATE users SET balance = balance \\+ \\$1").
		WithArgs(30.0, int64(1)). // 10 * 2 * 3 / 2 = 30
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// INSERT transaction
	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(1), 30.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	// DELETE upgrade
	mock.ExpectExec("^DELETE FROM upgrades").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	// UPDATE passive_income 1
	mock.ExpectExec("^\\s*UPDATE users u SET passive_income").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// UPDATE passive_income 2
	mock.ExpectExec("^\\s*UPDATE users SET passive_income").
		WithArgs(int64(1)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectCommit()

	err = repo.DeleteItem(context.Background(), 1)
	assert.NoError(t, err)
}

func TestShopRepository_SellItem(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewShopRepository(mock)
	mock.ExpectBegin()

	mock.ExpectQuery("^SELECT passive_income FROM users WHERE tg_id = \\$1 FOR UPDATE$").
		WithArgs(int64(1)).
		WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(10.0))

	mock.ExpectQuery("^SELECT base_price, profit_increase FROM upgrades WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))

	mock.ExpectQuery("^SELECT quantity FROM user_upgrades").
		WithArgs(int64(1), 1).
		WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(2))

	mock.ExpectExec("^UPDATE users SET balance = balance \\+ \\$1, passive_income = GREATEST").
		WithArgs(10.0, 5.0, int64(1)). // 10.0 * 2 * 0.5 = 10.0
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^UPDATE user_upgrades SET quantity = quantity - 1").
		WithArgs(int64(1), 1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(1), 10.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectCommit()

	err = repo.SellItem(context.Background(), 1, 1)
	assert.NoError(t, err)
}
