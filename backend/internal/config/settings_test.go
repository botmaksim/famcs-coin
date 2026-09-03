package config

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSettingsCache(t *testing.T) {
	cache := &SettingsCache{
		settings: make(map[string]interface{}),
	}

	InitEnvVars()

	err := cache.LoadFromDB(context.Background(), nil)
	assert.NoError(t, err)

	err = cache.Reload(context.Background(), nil)
	assert.NoError(t, err)

	// Fallback tests
	assert.Equal(t, 10, cache.GetInt("missing_key", 10))
	str, exists := cache.GetString("missing_str")
	assert.False(t, exists)
	assert.Equal(t, "", str)

	// Set values
	cache.mu.Lock()
	cache.settings["max_energy"] = float64(1500)
	cache.settings["site_name"] = "FAMCS"
	cache.settings["num_as_str"] = 42
	cache.mu.Unlock()

	assert.Equal(t, 1500, cache.GetInt("max_energy", 1000))
	assert.Equal(t, 10, cache.GetInt("site_name", 10)) // wrong type fallback

	strVal, ok := cache.GetString("site_name")
	assert.True(t, ok)
	assert.Equal(t, "FAMCS", strVal)

	strNum, okNum := cache.GetString("num_as_str")
	assert.True(t, okNum)
	assert.Equal(t, "42", strNum)

	all := cache.GetAll()
	assert.Equal(t, 3, len(all))
	assert.Equal(t, "FAMCS", all["site_name"])
}
