package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/repository"
)

type LeaderboardHandler struct {
	userRepo repository.UserRepository
}

func NewLeaderboardHandler(userRepo repository.UserRepository) *LeaderboardHandler {
	return &LeaderboardHandler{userRepo: userRepo}
}

func (h *LeaderboardHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get top 50 users
	users, err := h.userRepo.GetLeaderboard(r.Context(), 50)
	if err != nil {
		http.Error(w, "Failed to get leaderboard", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"users": users,
	})
}
