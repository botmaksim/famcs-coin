package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/repository"
)

type ClickerHandler struct {
	userRepo repository.UserRepository
}

func NewClickerHandler(userRepo repository.UserRepository) *ClickerHandler {
	return &ClickerHandler{userRepo: userRepo}
}

func (h *ClickerHandler) Click(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Count int `json:"count"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.Count <= 0 || req.Count > 1000 {
		http.Error(w, "Invalid count", http.StatusBadRequest)
		return
	}

	// Each click gives 1 coin and costs 1 energy (can be configured later)
	coinsEarned := float64(req.Count)
	energyCost := req.Count

	err := h.userRepo.ProcessClick(r.Context(), tgID, coinsEarned, energyCost)
	if err != nil {
		if err.Error() == "insufficient energy" {
			http.Error(w, "Insufficient energy", http.StatusBadRequest)
			return
		}
		http.Error(w, "Failed to process click", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
