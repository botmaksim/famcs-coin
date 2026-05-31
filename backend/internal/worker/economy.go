package worker

import (
	"context"
	"log"
	"time"

	"famcscoin-backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

// StartEconomyWorker запускает фоновый процесс начисления пассивного дохода и восстановления энергии
func StartEconomyWorker(ctx context.Context, pool *pgxpool.Pool) {
	// Для тестов можно сделать тики раз в 10 секунд. В проде лучше раз в 1 минуту.
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	log.Println("🛠 Economy Worker started. Tick interval: 60s")

	for {
		select {
		case <-ctx.Done():
			log.Println("🛠 Economy Worker stopped.")
			return
		case <-ticker.C:
			processEconomyTick(pool)
		}
	}
}

func processEconomyTick(pool *pgxpool.Pool) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Обновляем настройки каждый тик (LiveOps)
	if err := config.GlobalSettings.LoadFromDB(ctx, pool); err != nil {
		log.Printf("⚠️ [Economy Worker] Failed to update settings cache: %v", err)
	}

	// Массовый UPDATE:
	// 1. Прибавляет к balance 1/60 от passive_income (т.к. тик раз в минуту, а passive_income — в час)
	// 2. Восстанавливает energy на 10 единиц, но не превышая max_energy
	// Обновляем только тех, кому это действительно нужно (доход > 0 или энергия не полная)
	query := `
		UPDATE users 
		SET 
			balance = balance + (passive_income / 60.0) 
				* (CASE WHEN sleep_until IS NOT NULL AND sleep_until > CURRENT_TIMESTAMP THEN 1.5 ELSE 1.0 END)
				* COALESCE((SELECT CASE WHEN boost_until IS NOT NULL AND boost_until > CURRENT_TIMESTAMP THEN 2.0 ELSE 1.0 END FROM squads WHERE squads.id = users.squad_id), 1.0),
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
		log.Printf("💸 [Economy Worker] Successfully updated %d users (passive income & energy restored)", rowsAffected)
	}
}
