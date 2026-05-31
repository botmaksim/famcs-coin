package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
)

func (r *shopRepository) GetSkins(ctx context.Context, tgID int64) ([]*models.Skin, error) {
	query := `
		SELECT s.id, s.name, s.price, s.image_url, 
		       (us.skin_id IS NOT NULL) AS is_owned,
		       (u.active_skin_id = s.id) AS is_active
		FROM skins s
		LEFT JOIN user_skins us ON s.id = us.skin_id AND us.user_id = $1
		LEFT JOIN users u ON u.tg_id = $1
		ORDER BY s.price ASC, s.id ASC
	`
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("GetSkins query error: %w", err)
	}
	defer rows.Close()

	var skins []*models.Skin
	for rows.Next() {
		skin := &models.Skin{}
		err := rows.Scan(&skin.ID, &skin.Name, &skin.Price, &skin.ImageURL, &skin.IsOwned, &skin.IsActive)
		if err != nil {
			return nil, fmt.Errorf("GetSkins scan error: %w", err)
		}
		skins = append(skins, skin)
	}
	return skins, nil
}

func (r *shopRepository) BuySkin(ctx context.Context, tgID int64, skinID int) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Block user
	var balance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&balance)
	if err != nil {
		return fmt.Errorf("failed to lock user: %w", err)
	}

	// Get skin price
	var price float64
	err = tx.QueryRow(ctx, "SELECT price FROM skins WHERE id = $1", skinID).Scan(&price)
	if err != nil {
		return fmt.Errorf("skin not found: %w", err)
	}

	// Check if already owned
	var exists bool
	err = tx.QueryRow(ctx, "SELECT TRUE FROM user_skins WHERE user_id = $1 AND skin_id = $2", tgID, skinID).Scan(&exists)
	if err == nil && exists {
		return fmt.Errorf("skin already owned")
	}

	if balance < price {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct balance
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", price, tgID)
	if err != nil {
		return fmt.Errorf("failed to deduct balance: %w", err)
	}

	// Add to user_skins
	_, err = tx.Exec(ctx, "INSERT INTO user_skins (user_id, skin_id) VALUES ($1, $2)", tgID, skinID)
	if err != nil {
		return fmt.Errorf("failed to insert user_skin: %w", err)
	}

	// Transaction log
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, amount, type) VALUES ($1, $2, 'buy_skin')", tgID, price)
	if err != nil {
		return fmt.Errorf("failed to log transaction: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *shopRepository) SetActiveSkin(ctx context.Context, tgID int64, skinID int) error {
	// First check if user owns the skin (or skin_id is 1, which is base and always free - actually it's easier if base is also added to user_skins or just check price=0)
	// Base skin costs 0, maybe everyone has it. Let's just check user_skins or if skin price is 0.
	
	// Check skin ownership
	var isOwned bool
	var price int
	err := r.pool.QueryRow(ctx, `
		SELECT (us.skin_id IS NOT NULL), s.price 
		FROM skins s 
		LEFT JOIN user_skins us ON s.id = us.skin_id AND us.user_id = $1 
		WHERE s.id = $2
	`, tgID, skinID).Scan(&isOwned, &price)
	
	if err != nil {
		return fmt.Errorf("failed to check skin: %w", err)
	}
	
	if !isOwned && price > 0 {
		return fmt.Errorf("you don't own this skin")
	}

	// Set active
	_, err = r.pool.Exec(ctx, "UPDATE users SET active_skin_id = $1 WHERE tg_id = $2", skinID, tgID)
	if err != nil {
		return fmt.Errorf("failed to set active skin: %w", err)
	}

	return nil
}
