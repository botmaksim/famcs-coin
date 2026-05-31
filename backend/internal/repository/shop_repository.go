package repository

import (
	"context"
	"fmt"
	"math"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ShopRepository interface {
	BuyUpgrade(ctx context.Context, tgID int64, upgradeID int) error
	GetShopItemsForUser(ctx context.Context, tgID int64) ([]*models.ShopItem, error)
	GetSkins(ctx context.Context, tgID int64) ([]*models.Skin, error)
	BuySkin(ctx context.Context, tgID int64, skinID int) error
	SetActiveSkin(ctx context.Context, tgID int64, skinID int) error
}

type shopRepository struct {
	pool *pgxpool.Pool
}

func NewShopRepository(pool *pgxpool.Pool) ShopRepository {
	return &shopRepository{pool: pool}
}

func (r *shopRepository) BuyUpgrade(ctx context.Context, tgID int64, upgradeID int) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Блокируем строку юзера (FOR UPDATE)
	var userBalance float64
	var passiveIncome float64
	var sleepUntil *time.Time
	err = tx.QueryRow(ctx, "SELECT balance, passive_income, sleep_until FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&userBalance, &passiveIncome, &sleepUntil)
	if err != nil {
		return fmt.Errorf("failed to lock user: %w", err)
	}

	if sleepUntil != nil && sleepUntil.After(time.Now()) {
		return fmt.Errorf("shop locked during sleep")
	}

	// 2. Получаем базовую инфу об апгрейде
	var basePrice float64
	var priceMultiplier float64
	var profitIncrease float64
	err = tx.QueryRow(ctx, "SELECT base_price, price_multiplier, profit_increase FROM upgrades WHERE id = $1", upgradeID).
		Scan(&basePrice, &priceMultiplier, &profitIncrease)
	if err != nil {
		return fmt.Errorf("upgrade not found: %w", err)
	}

	// 3. Узнаем текущий уровень апгрейда у юзера
	var currentLevel int
	err = tx.QueryRow(ctx, "SELECT level FROM user_upgrades WHERE user_id = $1 AND upgrade_id = $2", tgID, upgradeID).Scan(&currentLevel)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("failed to check user upgrade: %w", err)
	}

	// 4. Считаем стоимость апгрейда
	// Если уровень 0 (еще не куплен), то basePrice. Иначе basePrice * (priceMultiplier ^ currentLevel)
	cost := basePrice
	if currentLevel > 0 {
		cost = basePrice * math.Pow(priceMultiplier, float64(currentLevel))
	}

	if userBalance < cost {
		return fmt.Errorf("insufficient balance")
	}

	// 5. Обновляем user_upgrades
	if currentLevel == 0 {
		_, err = tx.Exec(ctx, "INSERT INTO user_upgrades (user_id, upgrade_id, level) VALUES ($1, $2, 1)", tgID, upgradeID)
	} else {
		_, err = tx.Exec(ctx, "UPDATE user_upgrades SET level = level + 1 WHERE user_id = $1 AND upgrade_id = $2", tgID, upgradeID)
	}
	if err != nil {
		return fmt.Errorf("failed to update user_upgrades: %w", err)
	}

	// 6. Списываем деньги и начисляем passive income
	newBalance := userBalance - cost
	newPassiveIncome := passiveIncome + profitIncrease
	_, err = tx.Exec(ctx, "UPDATE users SET balance = $1, passive_income = $2 WHERE tg_id = $3", newBalance, newPassiveIncome, tgID)
	if err != nil {
		return fmt.Errorf("failed to update user balance: %w", err)
	}

	// 7. Сохраняем в транзакции
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, amount, type) VALUES ($1, $2, 'shop_buy')", tgID, cost)
	if err != nil {
		return fmt.Errorf("failed to insert transaction: %w", err)
	}

	return tx.Commit(ctx)
}
