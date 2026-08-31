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

func TestFeedbackHandler_GetFeedbacks(t *testing.T) {
	mockRepo := new(MockFeedbackRepository)
	handler := NewFeedbackHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/feedbacks", nil)
		mockFeedbacks := []models.Feedback{{ID: 1, Text: "Test"}}
		mockRepo.On("GetFeedbacks", mock.Anything).Return(mockFeedbacks, nil).Once()

		w := httptest.NewRecorder()
		handler.GetFeedbacks(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeedbackHandler_CreateFeedback(t *testing.T) {
	mockRepo := new(MockFeedbackRepository)
	handler := NewFeedbackHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"text": "Great app"})
		req := httptest.NewRequest("POST", "/feedbacks", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("CreateFeedback", mock.Anything, int64(123), "Great app").Return(nil).Once()

		w := httptest.NewRecorder()
		handler.CreateFeedback(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

