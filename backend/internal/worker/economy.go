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
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	log.Println("[Economy Worker] Started. Tick interval: 60s")

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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Update settings cache on each tick
	if err := config.GlobalSettings.LoadFromDB(ctx, pool); err != nil {
		log.Printf("Failed to update settings cache: %v", err)
	}

	// Mass update passive income and restore energy
	query := `
		UPDATE users 
		SET 
			balance = balance + (passive_income / 60.0),
			energy = LEAST(energy + 10, max_energy)
		WHERE passive_income > 0 OR energy < max_energy
	`

	res, err := pool.Exec(ctx, query)
	if err != nil {
		log.Printf("❌ [Economy Worker] Failed to update economy: %v", err)
		return
	}

	rowsAffected := res.RowsAffected()
	if rowsAffected > 0 {
		log.Printf("[Economy Worker] Successfully updated %d users (passive income & energy restored)", rowsAffected)
	}
}
