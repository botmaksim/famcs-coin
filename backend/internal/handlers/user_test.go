package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"famcscoin-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestUserHandler_GetProfile(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewUserHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/profile", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockUser := &models.User{TgID: 123, Username: "test"}
		mockRepo.On("GetUserByID", mock.Anything, int64(123)).Return(mockUser, nil).Once()

		w := httptest.NewRecorder()
		handler.GetProfile(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserHandler_UpdateSettings(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewUserHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{"custom_name": "Test Name", "is_hidden": true})
		req := httptest.NewRequest("POST", "/settings", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("UpdateSettings", mock.Anything, int64(123), mock.AnythingOfType("*string"), true).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.UpdateSettings(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

