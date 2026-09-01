package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestLeaderboardHandler_GetLeaderboard_Errors(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewLeaderboardHandler(mockRepo)

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/leaderboard?limit=10", nil)
		mockRepo.On("GetLeaderboard", mock.Anything, 10).Return(nil, errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.GetLeaderboard(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("default limit on error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/leaderboard?limit=invalid", nil)
		mockRepo.On("GetLeaderboard", mock.Anything, 50).Return(nil, nil).Once()
		w := httptest.NewRecorder()
		handler.GetLeaderboard(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})
}
