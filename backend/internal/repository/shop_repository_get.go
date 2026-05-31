package repository

import (
	"context"
	"fmt"
	
	"famcscoin-backend/internal/models"
)

func (r *shopRepository) GetShopItemsForUser(ctx context.Context, tgID int64) ([]*models.ShopItem, error) {
	query := `
		SELECT 
			u.id, 
			u.title, 
			COALESCE(u.description, ''), 
			u.category, 
			u.profit_increase,
			COALESCE(u.image_url, ''),
			COALESCE(uu.level, 0) as current_level,
			CASE 
				WHEN COALESCE(uu.level, 0) = 0 THEN u.base_price
				ELSE u.base_price * POWER(u.price_multiplier, uu.level)
			END as price
		FROM upgrades u
		LEFT JOIN user_upgrades uu ON u.id = uu.upgrade_id AND uu.user_id = $1
		ORDER BY u.id ASC
	`
	
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("failed to query shop items: %w", err)
	}
	defer rows.Close()

	var items []*models.ShopItem
	for rows.Next() {
		item := &models.ShopItem{}
		err := rows.Scan(
			&item.ID, &item.Title, &item.Description, &item.Category, 
			&item.ProfitIncrease, &item.ImageURL, &item.CurrentLevel, &item.Price,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan shop item: %w", err)
		}
		items = append(items, item)
	}
	
	return items, nil
}
