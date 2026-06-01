package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/repository"
)

type WebPublicHandler struct {
	userRepo  repository.UserRepository
	squadRepo repository.SquadRepository
}

func NewWebPublicHandler(userRepo repository.UserRepository, squadRepo repository.SquadRepository) *WebPublicHandler {
	return &WebPublicHandler{
		userRepo:  userRepo,
		squadRepo: squadRepo,
	}
}

func (h *WebPublicHandler) GetLeaderboardPlayers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := h.userRepo.GetPublicLeaderboard(r.Context(), 50)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *WebPublicHandler) GetLeaderboardSquads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	squads, err := h.squadRepo.GetTopSquads(r.Context(), 50)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(squads)
}

func (h *WebPublicHandler) GetHallOfFame(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	admins, err := h.userRepo.GetHallOfFame(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(admins)
}

func (h *WebPublicHandler) GetPublicConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	settings := config.GlobalSettings.GetAll()
	// Filter sensible public ones
	publicSettings := map[string]interface{}{}
	if val, ok := settings["referral_reward"]; ok {
		publicSettings["referral_reward"] = val
	}
	if val, ok := settings["daily_quiz_reward"]; ok {
		publicSettings["daily_quiz_reward"] = val
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(publicSettings)
}
