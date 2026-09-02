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

func TestClickerHandler_Click_Errors(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewClickerHandler(mockRepo)

	t.Run("unauthorized no context", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{"count": 10}`)))
		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid count <= 0", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{"count": 0}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid count > 1000", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{"count": 1001}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("repo error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{"count": 10}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("ProcessClick", mock.Anything, int64(123), float64(10), 10).Return(0.0, 0, errors.New("db error")).Once()
		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		mockRepo.AssertExpectations(t)
	})
}
