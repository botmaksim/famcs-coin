package handlers

import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestUserHandler_GetProfile_Errors(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewUserHandler(mockRepo)

	t.Run("unauthorized no context", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/profile", nil)
		w := httptest.NewRecorder()
		handler.GetProfile(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("user not found", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/profile", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("GetUserByID", mock.Anything, int64(123)).Return(nil, errors.New("db error")).Once()
		w := httptest.NewRecorder()
		handler.GetProfile(w, req)
		assert.Equal(t, http.StatusNotFound, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserHandler_UpdateSettings_Errors(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewUserHandler(mockRepo)

	t.Run("unauthorized no context", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/settings", bytes.NewBuffer([]byte(`{}`)))
		w := httptest.NewRecorder()
		handler.UpdateSettings(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/settings", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.UpdateSettings(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("repo error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/settings", bytes.NewBuffer([]byte(`{"is_hidden":true}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("UpdateSettings", mock.Anything, int64(123), mock.Anything, true).Return(errors.New("db error")).Once()
		w := httptest.NewRecorder()
		handler.UpdateSettings(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockRepo.AssertExpectations(t)
	})
}
