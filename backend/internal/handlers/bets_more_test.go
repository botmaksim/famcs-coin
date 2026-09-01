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

func TestBetHandler_GetBets_Errors(t *testing.T) {
	mockRepo := new(MockBetRepository)
	handler := NewBetHandler(mockRepo)

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/bets", nil)
		mockRepo.On("GetBets", mock.Anything, int64(0)).Return(nil, errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.GetBets(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestBetHandler_PlaceBet_Errors(t *testing.T) {
	mockRepo := new(MockBetRepository)
	handler := NewBetHandler(mockRepo)

	t.Run("unauthorized no context", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/bets/place", bytes.NewBuffer([]byte(`{"event_id": 1}`)))
		w := httptest.NewRecorder()
		handler.PlaceBet(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/bets/place", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.PlaceBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("repo error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/bets/place", bytes.NewBuffer([]byte(`{"event_id": 1, "option_index": 0, "amount": 10}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("PlaceBet", mock.Anything, int64(123), 1, 0, 10.0).Return(errors.New("bad bet")).Once()
		w := httptest.NewRecorder()
		handler.PlaceBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}
