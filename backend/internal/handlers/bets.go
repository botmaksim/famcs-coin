package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/hub"
	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type BetHandler struct {
	repo repository.BetRepository
}

func NewBetHandler(repo repository.BetRepository) *BetHandler {
	return &BetHandler{repo: repo}
}

func (h *BetHandler) GetActive(w http.ResponseWriter, r *http.Request) {
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

	events, err := h.repo.GetActiveEvents(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get events", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events": events,
	})
}

type placeBetRequest struct {
	EventID      int     `json:"event_id"`
	ChosenOption string  `json:"chosen_option"`
	Amount       float64 `json:"amount"`
}

func (h *BetHandler) PlaceBet(w http.ResponseWriter, r *http.Request) {
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

	var req placeBetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.repo.PlaceBet(r.Context(), tgID, req.EventID, req.ChosenOption, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hub.Broadcast("bet_placed", map[string]interface{}{
		"event_id": req.EventID,
		"amount":   req.Amount,
		"option":   req.ChosenOption,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
