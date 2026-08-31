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

func TestBetHandler_GetBets(t *testing.T) {
	mockRepo := new(MockBetRepository)
	handler := NewBetHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/bets", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockEvents := []models.BetEvent{{ID: 1, Title: "A"}}
		mockRepo.On("GetBets", mock.Anything, int64(123)).Return(mockEvents, nil).Once()

		w := httptest.NewRecorder()
		handler.GetBets(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestBetHandler_PlaceBet(t *testing.T) {
	mockRepo := new(MockBetRepository)
	handler := NewBetHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{"event_id": 1, "option_index": 0, "amount": 10.0})
		req := httptest.NewRequest("POST", "/place", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("PlaceBet", mock.Anything, int64(123), 1, 0, 10.0).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.PlaceBet(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

