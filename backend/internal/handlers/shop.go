package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type ShopHandler struct {
	shopRepo repository.ShopRepository
}

func NewShopHandler(shopRepo repository.ShopRepository) *ShopHandler {
	return &ShopHandler{shopRepo: shopRepo}
}

type buyRequest struct {
	UpgradeID int `json:"upgrade_id"`
}

func (h *ShopHandler) Buy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	var req buyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.UpgradeID <= 0 {
		http.Error(w, "Invalid upgrade_id", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.BuyUpgrade(r.Context(), tgID, req.UpgradeID)
	if err != nil {
		// В реальном приложении стоит разделять ошибки пользователя (например, insufficient balance) 
		// и системные ошибки для возврата 400 или 500 соответственно.
		if err.Error() == "insufficient balance" {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if err.Error() == "shop locked during sleep" {
			http.Error(w, "Нельзя покупать карточки, пока коины спят", http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *ShopHandler) GetSkins(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	skins, err := h.shopRepo.GetSkins(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get skins", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"skins": skins,
	})
}

type skinRequest struct {
	SkinID int `json:"skin_id"`
}

func (h *ShopHandler) BuySkin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	var req skinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.BuySkin(r.Context(), tgID, req.SkinID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *ShopHandler) SetActiveSkin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	var req skinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.SetActiveSkin(r.Context(), tgID, req.SkinID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *ShopHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	items, err := h.shopRepo.GetShopItemsForUser(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get shop items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"items": items,
	})
}
