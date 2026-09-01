package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"famcscoin-backend/internal/repository"
)

type LeaderboardHandler struct {
	userRepo repository.UserRepository
}

func NewLeaderboardHandler(userRepo repository.UserRepository) *LeaderboardHandler {
	return &LeaderboardHandler{userRepo: userRepo}
}

func (h *LeaderboardHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50 // default
	}

	sortBy := r.URL.Query().Get("sort")
	if sortBy != "income" {
		sortBy = "balance" // default
	}

	users, err := h.userRepo.GetLeaderboard(r.Context(), limit, sortBy)
	if err != nil {
		http.Error(w, "Failed to get leaderboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
