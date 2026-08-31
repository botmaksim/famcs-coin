package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"famcscoin-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestLeaderboardHandler_GetLeaderboard(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewLeaderboardHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/leaderboard", nil)
		mockUsers := []models.User{{TgID: 1, Balance: 100}}
		mockRepo.On("GetLeaderboard", mock.Anything, 50).Return(mockUsers, nil).Once()

		w := httptest.NewRecorder()
		handler.GetLeaderboard(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}
