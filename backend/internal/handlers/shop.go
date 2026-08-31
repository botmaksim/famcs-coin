package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/repository"
)

type ShopHandler struct {
	shopRepo repository.ShopRepository
}

func NewShopHandler(shopRepo repository.ShopRepository) *ShopHandler {
	return &ShopHandler{shopRepo: shopRepo}
}

func (h *ShopHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	items, err := h.shopRepo.GetItems(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *ShopHandler) Buy(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		UpgradeID int `json:"upgrade_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.BuyItem(r.Context(), tgID, req.UpgradeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *ShopHandler) Sell(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		UpgradeID int `json:"upgrade_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.SellItem(r.Context(), tgID, req.UpgradeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
