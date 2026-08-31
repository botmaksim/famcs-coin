package repository

import (
	"context"
	"testing"

	"famcscoin-backend/internal/models"
	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestShopRepository_GetItems(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewShopRepository(mock)

	rows := mock.NewRows([]string{"id", "title", "description", "base_price", "profit_increase", "image_url", "quantity"}).
		AddRow(1, "Upgrade1", "Desc", 10.0, 5.0, "url", 2)

	mock.ExpectQuery("^SELECT u.id, u.title, u.description, u.base_price, u.profit_increase, u.image_url, COALESCE\\(uu.quantity, 0\\)").
		WithArgs(int64(123)).
		WillReturnRows(rows)

	items, err := repo.GetItems(context.Background(), 123)
	assert.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "Upgrade1", items[0].Title)
	assert.Equal(t, 30.0, items[0].Price) // 10.0 * (2 + 1)
}

func TestShopRepository_BuyItem(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewShopRepository(mock)

	mock.ExpectBegin()

	// Lock user
	mock.ExpectQuery("^SELECT balance FROM users WHERE tg_id = \\$1 FOR UPDATE$").
		WithArgs(int64(123)).
		WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))

	// Get Upgrade
	mock.ExpectQuery("^SELECT base_price, profit_increase FROM upgrades WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))

	// Get User Upgrade
	mock.ExpectQuery("^SELECT quantity FROM user_upgrades WHERE user_id = \\$1 AND upgrade_id = \\$2$").
		WithArgs(int64(123), 1).
		WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))

	// Update user
	mock.ExpectExec("^UPDATE users SET balance = balance - \\$1, passive_income = passive_income \\+ \\$2 WHERE tg_id = \\$3$").
		WithArgs(10.0, 5.0, int64(123)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// Upsert user_upgrades
	mock.ExpectExec("^INSERT INTO user_upgrades").
		WithArgs(int64(123), 1).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	// Insert transaction
	mock.ExpectExec("^INSERT INTO transactions").
		WithArgs(int64(123), -10.0).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectCommit()

	err = repo.BuyItem(context.Background(), 123, 1)
	assert.NoError(t, err)
}

func TestShopRepository_CreateItem(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewShopRepository(mock)

	mock.ExpectExec("^INSERT INTO upgrades").
		WithArgs("Title", "Desc", 10.0, 5.0, "URL").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.CreateItem(context.Background(), &models.Upgrade{
		Title: "Title", Description: "Desc", BasePrice: 10.0, ProfitIncrease: 5.0, ImageURL: "URL",
	})
	assert.NoError(t, err)
}
