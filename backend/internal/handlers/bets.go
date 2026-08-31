package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/repository"
)

type BetHandler struct {
	betRepo repository.BetRepository
}

func NewBetHandler(repo repository.BetRepository) *BetHandler {
	return &BetHandler{betRepo: repo}
}

func (h *BetHandler) GetBets(w http.ResponseWriter, r *http.Request) {
	tgID, _ := r.Context().Value("tg_id").(int64) // might be empty for web

	bets, err := h.betRepo.GetBets(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get bets", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bets)
}

func (h *BetHandler) PlaceBet(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		EventID     int     `json:"event_id"`
		OptionIndex int     `json:"option_index"`
		Amount      float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.betRepo.PlaceBet(r.Context(), tgID, req.EventID, req.OptionIndex, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
