package repository

import (
	"context"
	"errors"
	"testing"

	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestShopRepository_BuyItem_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("begin err"))
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})
	
	t.Run("lock user err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance FROM users").WithArgs(int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})

	t.Run("get upgrade err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})

	t.Run("get user upgrade level err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})

	t.Run("insufficient balance", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(0.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))
		mock.ExpectRollback()
		err := repo.BuyItem(context.Background(), 1, 1)
		assert.Error(t, err)
		assert.Equal(t, "insufficient balance", err.Error())
	})

	t.Run("update user err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, 5.0, int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})

	t.Run("insert upgrade err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, 5.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO user_upgrades").WithArgs(int64(1), 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})
	
	t.Run("insert tx err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT balance").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"balance"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, 5.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO user_upgrades").WithArgs(int64(1), 1).WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), -10.0).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.BuyItem(context.Background(), 1, 1))
	})
}

func TestShopRepository_SellItem_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("begin err"))
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})
	
	t.Run("lock user err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income FROM users").WithArgs(int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("get upgrade err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("get user upgrade level err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("qty 0 err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(0))
		mock.ExpectRollback()
		err := repo.SellItem(context.Background(), 1, 1)
		assert.Error(t, err)
		assert.Equal(t, "you don't own this item", err.Error())
	})

	t.Run("update user err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(2))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, 5.0, int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("update user_upgrades err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(2))
		mock.ExpectExec("UPDATE users").WithArgs(10.0, 5.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("UPDATE user_upgrades").WithArgs(int64(1), 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("delete user_upgrades err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(1))
		mock.ExpectExec("UPDATE users").WithArgs(5.0, 5.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("DELETE FROM user_upgrades").WithArgs(int64(1), 1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})

	t.Run("insert tx err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT passive_income").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"passive_income"}).AddRow(100.0))
		mock.ExpectQuery("SELECT base_price").WithArgs(1).WillReturnRows(mock.NewRows([]string{"base_price", "profit_increase"}).AddRow(10.0, 5.0))
		mock.ExpectQuery("SELECT quantity").WithArgs(int64(1), 1).WillReturnRows(mock.NewRows([]string{"quantity"}).AddRow(1))
		mock.ExpectExec("UPDATE users").WithArgs(5.0, 5.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("DELETE FROM user_upgrades").WithArgs(int64(1), 1).WillReturnResult(pgxmock.NewResult("DELETE", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 5.0).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.SellItem(context.Background(), 1, 1))
	})
}

func TestShopRepository_GetItems_Errors(t *testing.T) {
	mock, _ := pgxmock.NewPool()
	defer mock.Close()
	repo := NewShopRepository(mock)

	mock.ExpectQuery("SELECT").WithArgs(int64(1)).WillReturnError(errors.New("db err"))
	_, err := repo.GetItems(context.Background(), 1)
	assert.Error(t, err)

	mock.ExpectQuery("SELECT").WithArgs(int64(1)).WillReturnRows(mock.NewRows([]string{"id", "title"}).AddRow(1, "title"))
	items, err := repo.GetItems(context.Background(), 1)
	assert.NoError(t, err)
	assert.Len(t, items, 0)
}

func TestShopRepository_DeleteItem_Errors(t *testing.T) {
	t.Run("begin err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin().WillReturnError(errors.New("db err"))
		assert.Error(t, repo.DeleteItem(context.Background(), 1))
	})

	t.Run("query err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT uu.user_id").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.DeleteItem(context.Background(), 1))
	})

	t.Run("update balance err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT uu.user_id").WithArgs(1).WillReturnRows(mock.NewRows([]string{"user_id", "quantity", "base_price"}).AddRow(int64(1), 1, 10.0))
		mock.ExpectExec("UPDATE users SET balance").WithArgs(10.0, int64(1)).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.DeleteItem(context.Background(), 1))
	})
	
	t.Run("insert tx err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT uu.user_id").WithArgs(1).WillReturnRows(mock.NewRows([]string{"user_id", "quantity", "base_price"}).AddRow(int64(1), 1, 10.0))
		mock.ExpectExec("UPDATE users SET balance").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 10.0).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.DeleteItem(context.Background(), 1))
	})

	t.Run("delete upgrade err", func(t *testing.T) {
		mock, _ := pgxmock.NewPool()
		defer mock.Close()
		repo := NewShopRepository(mock)
		mock.ExpectBegin()
		mock.ExpectQuery("SELECT uu.user_id").WithArgs(1).WillReturnRows(mock.NewRows([]string{"user_id", "quantity", "base_price"}).AddRow(int64(1), 1, 10.0))
		mock.ExpectExec("UPDATE users SET balance").WithArgs(10.0, int64(1)).WillReturnResult(pgxmock.NewResult("UPDATE", 1))
		mock.ExpectExec("INSERT INTO transactions").WithArgs(int64(1), 10.0).WillReturnResult(pgxmock.NewResult("INSERT", 1))
		mock.ExpectExec("DELETE FROM upgrades").WithArgs(1).WillReturnError(errors.New("db err"))
		mock.ExpectRollback()
		assert.Error(t, repo.DeleteItem(context.Background(), 1))
	})
}
