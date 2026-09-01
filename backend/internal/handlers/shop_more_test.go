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

func TestShopHandler_GetItems_Errors(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/shop/items", nil)
		w := httptest.NewRecorder()
		handler.GetItems(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/shop/items", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("GetItems", mock.Anything, int64(123)).Return(nil, errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.GetItems(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestShopHandler_Buy_Errors(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/buy", bytes.NewBuffer([]byte(`{"upgrade_id": 1}`)))
		w := httptest.NewRecorder()
		handler.Buy(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/buy", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.Buy(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/buy", bytes.NewBuffer([]byte(`{"upgrade_id": 1}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("BuyItem", mock.Anything, int64(123), 1).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.Buy(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestShopHandler_Sell_Errors(t *testing.T) {
	mockRepo := new(MockShopRepository)
	handler := NewShopHandler(mockRepo)

	t.Run("unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/sell", bytes.NewBuffer([]byte(`{"upgrade_id": 1}`)))
		w := httptest.NewRecorder()
		handler.Sell(w, req)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/sell", bytes.NewBuffer([]byte(`{invalid}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		w := httptest.NewRecorder()
		handler.Sell(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/shop/sell", bytes.NewBuffer([]byte(`{"upgrade_id": 1}`)))
		ctx := context.WithValue(req.Context(), "tg_id", int64(123))
		req = req.WithContext(ctx)
		mockRepo.On("SellItem", mock.Anything, int64(123), 1).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.Sell(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}
