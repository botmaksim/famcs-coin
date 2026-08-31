package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"famcscoin-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAdminHandler_UpdateRole(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	handler := NewAdminHandler(mockUserRepo, nil, nil, nil)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{"tg_id": 123, "role": "admin"})
		req := httptest.NewRequest("POST", "/admin/role", bytes.NewBuffer(body))

		mockUserRepo.On("UpdateRole", mock.Anything, int64(123), "admin").Return(nil).Once()

		w := httptest.NewRecorder()
		handler.UpdateRole(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockUserRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_CreateBet(t *testing.T) {
	mockBetRepo := new(MockBetRepository)
	handler := NewAdminHandler(nil, mockBetRepo, nil, nil)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(models.BetEvent{Title: "Test"})
		req := httptest.NewRequest("POST", "/admin/bets", bytes.NewBuffer(body))

		mockBetRepo.On("CreateBet", mock.Anything, mock.AnythingOfType("*models.BetEvent")).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.CreateBet(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockBetRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_CloseBet(t *testing.T) {
	mockBetRepo := new(MockBetRepository)
	handler := NewAdminHandler(nil, mockBetRepo, nil, nil)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"event_id": 1, "winning_option_index": 0})
		req := httptest.NewRequest("POST", "/admin/bets/close", bytes.NewBuffer(body))

		mockBetRepo.On("CloseBet", mock.Anything, 1, 0).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.CloseBet(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockBetRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_CreateShopItem(t *testing.T) {
	mockShopRepo := new(MockShopRepository)
	handler := NewAdminHandler(nil, nil, mockShopRepo, nil)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(models.Upgrade{Title: "Test"})
		req := httptest.NewRequest("POST", "/admin/shop", bytes.NewBuffer(body))

		mockShopRepo.On("CreateItem", mock.Anything, mock.AnythingOfType("*models.Upgrade")).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.CreateShopItem(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockShopRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_DeleteShopItem(t *testing.T) {
	mockShopRepo := new(MockShopRepository)
	handler := NewAdminHandler(nil, nil, mockShopRepo, nil)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]int{"upgrade_id": 1})
		req := httptest.NewRequest("DELETE", "/admin/shop", bytes.NewBuffer(body))

		mockShopRepo.On("DeleteItem", mock.Anything, 1).Return(nil).Once()

		w := httptest.NewRecorder()
		handler.DeleteShopItem(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockShopRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_UpdateFeedbackStatus(t *testing.T) {
	mockFeedbackRepo := new(MockFeedbackRepository)
	handler := NewAdminHandler(nil, nil, nil, mockFeedbackRepo)

	t.Run("success", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{"feedback_id": 1, "status": "reviewed"})
		req := httptest.NewRequest("POST", "/admin/feedback/status", bytes.NewBuffer(body))

		mockFeedbackRepo.On("UpdateStatus", mock.Anything, 1, "reviewed").Return(nil).Once()

		w := httptest.NewRecorder()
		handler.UpdateFeedbackStatus(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockFeedbackRepo.AssertExpectations(t)
	})
}

func TestAdminHandler_Errors(t *testing.T) {
	mockUserRepo := new(MockUserRepository)
	mockBetRepo := new(MockBetRepository)
	mockShopRepo := new(MockShopRepository)
	mockFeedbackRepo := new(MockFeedbackRepository)
	handler := NewAdminHandler(mockUserRepo, mockBetRepo, mockShopRepo, mockFeedbackRepo)

	t.Run("UpdateRole_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/role", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.UpdateRole(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
	
	t.Run("CreateBet_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.CreateBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("CloseBet_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets/close", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.CloseBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("CreateShopItem_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.CreateShopItem(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("DeleteShopItem_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.DeleteShopItem(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("UpdateFeedbackStatus_Err", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/feedback/status", bytes.NewBufferString("{bad}"))
		w := httptest.NewRecorder()
		handler.UpdateFeedbackStatus(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}
