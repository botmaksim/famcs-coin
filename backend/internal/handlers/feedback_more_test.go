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

func TestFeedbackHandler_GetFeedbacks_Errors(t *testing.T) {
	mockRepo := new(MockFeedbackRepository)
	handler := NewFeedbackHandler(mockRepo)

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/feedbacks", nil)
		mockRepo.On("GetFeedbacks", mock.Anything).Return(nil, errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.GetFeedbacks(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestFeedbackHandler_CreateFeedback_Errors(t *testing.T) {
	mockRepo := new(MockFeedbackRepository)
	handler := NewFeedbackHandler(mockRepo)

	t.Run("unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/feedbacks/create", bytes.NewBuffer([]byte(`{"text": "hi"}`)))
		w := httptest.NewRecorder()
		handler.CreateFeedback(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/feedbacks/create", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.CreateFeedback(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/feedbacks/create", bytes.NewBuffer([]byte(`{"text": "hi"}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("CreateFeedback", mock.Anything, int64(123), "hi").Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.CreateFeedback(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
