package worker

import (
	"context"
	"log"
	"time"

	"famcscoin-backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StartEconomyWorker runs background passive income and energy regeneration
func StartEconomyWorker(ctx context.Context, pool *pgxpool.Pool) {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	log.Println("[Economy Worker] Started. Tick interval: 3s")

	for {
		select {
		case <-ctx.Done():
			log.Println("[Economy Worker] Stopped.")
			return
		case <-ticker.C:
			processEconomyTick(pool)
		}
	}
}

func processEconomyTick(pool *pgxpool.Pool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Update settings cache on each tick
	if err := config.GlobalSettings.LoadFromDB(ctx, pool); err != nil {
		log.Printf("Failed to update settings cache: %v", err)
	}

	// Mass update passive income (+3s share of hourly rate) and restore energy (+9 every 3s = 3/s)
	query := `
		UPDATE users 
		SET 
			balance = balance + (passive_income / 1200.0),
			energy = LEAST(energy + 9, max_energy)
		WHERE (passive_income > 0 AND CURRENT_TIMESTAMP - last_active_at < INTERVAL '3 hours') OR energy < max_energy
	`

	res, err := pool.Exec(ctx, query)
	if err != nil {
		log.Printf("❌ [Economy Worker] Failed to update economy: %v", err)
		return
	}

	rowsAffected := res.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("[Economy Worker] Updated %d active users", rowsAffected)
	}
}
