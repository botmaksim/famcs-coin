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

func TestShopHandler_GetItems(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/items", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockItems := []models.ShopItem{{ID: 1, Title: "A"}}
		mockRepo.On("GetItems", mock.Anything, int64(123)).Return(mockItems, nil).Once()

		w := httptest.NewRecorder()
		handler.GetItems(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestShopHandler_Buy(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"upgrade_id": 1})
		req := httptest.NewRequest("POST", "/buy", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("BuyItem", mock.Anything, int64(123), 1).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.Buy(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

func TestShopHandler_Sell(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"upgrade_id": 1})
		req := httptest.NewRequest("POST", "/sell", bytes.NewBuffer(body))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)

		mockRepo.On("SellItem", mock.Anything, int64(123), 1).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.Sell(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
	})
}

