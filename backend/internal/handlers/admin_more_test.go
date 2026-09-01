package handlers

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAdminHandler_UpdateRole_Errors(t *testing.T) {
	uRepo := new(MockUserRepository)
	handler := NewAdminHandler(uRepo, nil, nil, nil)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/role", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.UpdateRole(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid role", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/role", bytes.NewBuffer([]byte(`{"tg_id": 123, "role": "hacker"}`)))
		w := httptest.NewRecorder()
		handler.UpdateRole(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/role", bytes.NewBuffer([]byte(`{"tg_id": 123, "role": "admin"}`)))
		uRepo.On("UpdateRole", mock.Anything, int64(123), "admin").Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.UpdateRole(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAdminHandler_CreateBet_Errors(t *testing.T) {
	bRepo := new(MockBetRepository)
	handler := NewAdminHandler(nil, bRepo, nil, nil)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets/create", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.CreateBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets/create", bytes.NewBuffer([]byte(`{"title": "Test"}`)))
		bRepo.On("CreateBet", mock.Anything, mock.Anything).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.CreateBet(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAdminHandler_CloseBet_Errors(t *testing.T) {
	bRepo := new(MockBetRepository)
	handler := NewAdminHandler(nil, bRepo, nil, nil)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets/close", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.CloseBet(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/bets/close", bytes.NewBuffer([]byte(`{"event_id": 1, "winning_option_index": 0}`)))
		bRepo.On("CloseBet", mock.Anything, 1, 0).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.CloseBet(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAdminHandler_CreateShopItem_Errors(t *testing.T) {
	sRepo := new(MockShopRepository)
	handler := NewAdminHandler(nil, nil, sRepo, nil)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop/create", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.CreateShopItem(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop/create", bytes.NewBuffer([]byte(`{"title": "Item"}`)))
		sRepo.On("CreateItem", mock.Anything, mock.Anything).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.CreateShopItem(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAdminHandler_DeleteShopItem_Errors(t *testing.T) {
	sRepo := new(MockShopRepository)
	handler := NewAdminHandler(nil, nil, sRepo, nil)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop/delete", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.DeleteShopItem(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/shop/delete", bytes.NewBuffer([]byte(`{"upgrade_id": 1}`)))
		sRepo.On("DeleteItem", mock.Anything, 1).Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.DeleteShopItem(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestAdminHandler_UpdateFeedbackStatus_Errors(t *testing.T) {
	fRepo := new(MockFeedbackRepository)
	handler := NewAdminHandler(nil, nil, nil, fRepo)

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/feedback/status", bytes.NewBuffer([]byte(`{invalid}`)))
		w := httptest.NewRecorder()
		handler.UpdateFeedbackStatus(w, req)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("db error", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/admin/feedback/status", bytes.NewBuffer([]byte(`{"feedback_id": 1, "status": "resolved"}`)))
		fRepo.On("UpdateStatus", mock.Anything, 1, "resolved").Return(errors.New("db err")).Once()
		w := httptest.NewRecorder()
		handler.UpdateFeedbackStatus(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}
