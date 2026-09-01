package repository

import (
	"context"
	"fmt"
	"log"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	)

type ShopRepository interface {
	GetItems(ctx context.Context, userID int64) ([]models.ShopItem, error)
	CreateItem(ctx context.Context, upgrade *models.Upgrade) error
	DeleteItem(ctx context.Context, upgradeID int) error
	BuyItem(ctx context.Context, userID int64, upgradeID int) error
	SellItem(ctx context.Context, userID int64, upgradeID int) error
}

type shopRepository struct {
	db db.PgxPoolIface
}

func NewShopRepository(db db.PgxPoolIface) ShopRepository {
	return &shopRepository{db: db}
}

func (r *shopRepository) GetItems(ctx context.Context, userID int64) ([]models.ShopItem, error) {
	query := `
		SELECT u.id, u.title, u.description, u.base_price, u.profit_increase, u.image_url, COALESCE(uu.quantity, 0)
		FROM upgrades u
		LEFT JOIN user_upgrades uu ON u.id = uu.upgrade_id AND uu.user_id = $1
		ORDER BY u.base_price ASC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.ShopItem{}
	for rows.Next() {
		var item models.ShopItem
		var basePrice float64
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &basePrice, &item.ProfitIncrease, &item.ImageURL, &item.Quantity); err != nil {
			log.Println("Error scanning shop item:", err)
			continue
		}
		// Linear price scaling
		item.Price = basePrice * float64(item.Quantity+1) 
		items = append(items, item)
	}
	return items, nil
}

func (r *shopRepository) CreateItem(ctx context.Context, upgrade *models.Upgrade) error {
	query := `INSERT INTO upgrades (title, description, base_price, profit_increase, image_url) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, upgrade.Title, upgrade.Description, upgrade.BasePrice, upgrade.ProfitIncrease, upgrade.ImageURL)
	return err
}

func (r *shopRepository) DeleteItem(ctx context.Context, upgradeID int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Refund users
	rows, err := tx.Query(ctx, `SELECT uu.user_id, uu.quantity, u.base_price FROM user_upgrades uu JOIN upgrades u ON uu.upgrade_id = u.id WHERE uu.upgrade_id = $1`, upgradeID)
	if err != nil {
		return err
	}
	
	type refund struct {
		userID int64
		amount float64
	}
	var refunds []refund
	for rows.Next() {
		var r refund
		var q int
		var bp float64
		if err := rows.Scan(&r.userID, &q, &bp); err == nil {
			// Calculate total spent via arithmetic progression sum
			r.amount = bp * float64(q) * float64(q+1) / 2.0
			refunds = append(refunds, r)
		}
	}
	rows.Close()

	for _, ref := range refunds {
		_, err = tx.Exec(ctx, `UPDATE users SET balance = balance + $1 WHERE tg_id = $2`, ref.amount, ref.userID)
		if err != nil {
			return err
		}
		_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'shop_refund')`, ref.userID, ref.amount)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx, `DELETE FROM upgrades WHERE id = $1`, upgradeID)
	if err != nil {
		return err
	}

	// Recalculate passive income for affected users
	_, err = tx.Exec(ctx, `
		UPDATE users u SET passive_income = COALESCE((
			SELECT SUM(uu.quantity * up.profit_increase) 
			FROM user_upgrades uu JOIN upgrades up ON uu.upgrade_id = up.id 
			WHERE uu.user_id = u.tg_id
		), 0)
		WHERE u.tg_id IN (SELECT user_id FROM user_upgrades WHERE upgrade_id = $1)
	`, upgradeID)
	// Rebuild passive income for all refunded users
	for _, ref := range refunds {
		_, _ = tx.Exec(ctx, `
			UPDATE users SET passive_income = COALESCE((
				SELECT SUM(uu.quantity * up.profit_increase) 
				FROM user_upgrades uu JOIN upgrades up ON uu.upgrade_id = up.id 
				WHERE uu.user_id = $1
			), 0) WHERE tg_id = $1
		`, ref.userID)
	}

	return tx.Commit(ctx)
}

func (r *shopRepository) BuyItem(ctx context.Context, userID int64, upgradeID int) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Lock user
	var balance float64
	err = tx.QueryRow(ctx, `SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE`, userID).Scan(&balance)
	if err != nil {
		return err
	}

	// Get Upgrade
	var basePrice, profit float64
	err = tx.QueryRow(ctx, `SELECT base_price, profit_increase FROM upgrades WHERE id = $1`, upgradeID).Scan(&basePrice, &profit)
	if err != nil {
		return err
	}

	// Get User Upgrade level
	var qty int
	err = tx.QueryRow(ctx, `SELECT quantity FROM user_upgrades WHERE user_id = $1 AND upgrade_id = $2`, userID, upgradeID).Scan(&qty)
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	price := basePrice * float64(qty+1)

	if balance < price {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct balance, increase passive income
	_, err = tx.Exec(ctx, `UPDATE users SET balance = balance - $1, passive_income = passive_income + $2 WHERE tg_id = $3`, price, profit, userID)
	if err != nil {
		return err
	}

	// Update or insert user upgrade
	_, err = tx.Exec(ctx, `
		INSERT INTO user_upgrades (user_id, upgrade_id, quantity) VALUES ($1, $2, 1)
		ON CONFLICT (user_id, upgrade_id) DO UPDATE SET quantity = user_upgrades.quantity + 1
	`, userID, upgradeID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'shop_buy')`, userID, -price)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *shopRepository) SellItem(ctx context.Context, userID int64, upgradeID int) error {
	// Sell one upgrade level for 50% refund
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Lock user
	var currentPassive float64
	err = tx.QueryRow(ctx, `SELECT passive_income FROM users WHERE tg_id = $1 FOR UPDATE`, userID).Scan(&currentPassive)
	if err != nil {
		return err
	}

	// Get Upgrade
	var basePrice, profit float64
	err = tx.QueryRow(ctx, `SELECT base_price, profit_increase FROM upgrades WHERE id = $1`, upgradeID).Scan(&basePrice, &profit)
	if err != nil {
		return err
	}

	// Get User Upgrade level
	var qty int
	err = tx.QueryRow(ctx, `SELECT quantity FROM user_upgrades WHERE user_id = $1 AND upgrade_id = $2`, userID, upgradeID).Scan(&qty)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("you don't own this item")
		}
		return err
	}

	if qty <= 0 {
		return fmt.Errorf("you don't own this item")
	}

	refundPrice := (basePrice * float64(qty)) * 0.5 

	// Update user
	_, err = tx.Exec(ctx, `UPDATE users SET balance = balance + $1, passive_income = GREATEST(0, passive_income - $2) WHERE tg_id = $3`, refundPrice, profit, userID)
	if err != nil {
		return err
	}

	if qty == 1 {
		_, err = tx.Exec(ctx, `DELETE FROM user_upgrades WHERE user_id = $1 AND upgrade_id = $2`, userID, upgradeID)
	} else {
		_, err = tx.Exec(ctx, `UPDATE user_upgrades SET quantity = quantity - 1 WHERE user_id = $1 AND upgrade_id = $2`, userID, upgradeID)
	}
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, 'shop_sell')`, userID, refundPrice)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
