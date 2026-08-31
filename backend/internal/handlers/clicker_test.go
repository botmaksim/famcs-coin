package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestClickerHandler_Click(t *testing.T) {
	mockRepo := new(MockUserRepository)
	handler := NewClickerHandler(mockRepo)

	t.Run("unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", nil)
		w := httptest.NewRecorder()

		handler.Click(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer([]byte(`{bad json}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid count", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"count": -5})
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"count": 10})
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("ProcessClick", mock.Anything, int64(123), 10.0, 10).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("insufficient energy", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"count": 100})
		req := httptest.NewRequest("POST", "/click", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("ProcessClick", mock.Anything, int64(123), 100.0, 100).Return(fmt.Errorf("insufficient energy")).Once()

		w := httptest.NewRecorder()
		handler.Click(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
		mockRepo.AssertExpectations(t)
	})
}
