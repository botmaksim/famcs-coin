package config

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SettingsCache stores game settings in memory for fast access without querying the DB every time.
type SettingsCache struct {
	mu       sync.RWMutex
	settings map[string]interface{}
}

// Global instance of the cache, could also be injected into handlers
var GlobalSettings = &SettingsCache{
	settings: make(map[string]interface{}),
}

// LoadFromDB fetches all settings from the database and updates the in-memory cache
func (c *SettingsCache) LoadFromDB(ctx context.Context, pool *pgxpool.Pool) error {
	query := `SELECT key, value FROM game_settings`
	rows, err := pool.Query(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to query game settings: %w", err)
	}
	defer rows.Close()

	newSettings := make(map[string]interface{})
	for rows.Next() {
		var key string
		var valueRaw []byte
		if err := rows.Scan(&key, &valueRaw); err != nil {
			log.Printf("⚠️ Failed to scan setting %s: %v", key, err)
			continue
		}

		var value interface{}
		if err := json.Unmarshal(valueRaw, &value); err != nil {
			log.Printf("⚠️ Failed to parse setting JSON for %s: %v", key, err)
			continue
		}

		newSettings[key] = value
	}

	c.mu.Lock()
	c.settings = newSettings
	c.mu.Unlock()

	log.Printf("⚙️  Game settings loaded into cache (%d keys)", len(newSettings))
	return nil
}

// GetInt returns a setting as an integer. Returns the fallback if missing or invalid type.
func (c *SettingsCache) GetInt(key string, fallback int) int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	val, exists := c.settings[key]
	if !exists {
		return fallback
	}

	// JSON numbers unmarshal as float64 by default in Go
	if vFloat, ok := val.(float64); ok {
		return int(vFloat)
	}
	return fallback
}
