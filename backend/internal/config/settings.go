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

func InitEnvVars() {
}

// LoadFromDB fetches all settings from the database and updates the in-memory cache
func (c *SettingsCache) LoadFromDB(ctx context.Context, pool *pgxpool.Pool) error {
	// Not needed right now, disabled as per user request to remove extra logic.
	return nil
}

func (c *SettingsCache) GetAll() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()
	res := make(map[string]interface{})
	for k, v := range c.settings {
		res[k] = v
	}
	return res
}

func (c *SettingsCache) Reload(ctx context.Context, pool *pgxpool.Pool) error {
	return c.LoadFromDB(ctx, pool)
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

// GetString returns a setting as a string. Returns the fallback if missing or invalid type.
func (c *SettingsCache) GetString(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	val, exists := c.settings[key]
	if !exists {
		return "", false
	}

	if vStr, ok := val.(string); ok {
		return vStr, true
	}
	return fmt.Sprintf("%v", val), true
}
