package bot

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewBot_InvalidToken(t *testing.T) {
	b, err := NewBot("invalid_bot_token", nil)
	assert.Error(t, err)
	assert.Nil(t, b)
}
