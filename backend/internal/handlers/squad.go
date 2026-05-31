package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type SquadHandler struct {
	squadRepo repository.SquadRepository
	userRepo  repository.UserRepository
}

func NewSquadHandler(squadRepo repository.SquadRepository, userRepo repository.UserRepository) *SquadHandler {
	return &SquadHandler{
		squadRepo: squadRepo,
		userRepo:  userRepo,
	}
}

func (h *SquadHandler) GetSquads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	squads, err := h.squadRepo.GetSquads(r.Context())
	if err != nil {
		http.Error(w, "Failed to get squads", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"squads": squads,
	})
}

type joinSquadRequest struct {
	SquadID int `json:"squad_id"`
}

func (h *SquadHandler) JoinSquad(w http.ResponseWriter, r *http.Request) {
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

	var req joinSquadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.SquadID <= 0 {
		http.Error(w, "Invalid squad_id", http.StatusBadRequest)
		return
	}

	// Validate squad exists
	squad, err := h.squadRepo.GetSquadByID(r.Context(), req.SquadID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if squad == nil {
		http.Error(w, "Squad not found", http.StatusNotFound)
		return
	}

	// Join squad
	if err := h.userRepo.JoinSquad(r.Context(), tgID, req.SquadID); err != nil {
		http.Error(w, "Failed to join squad", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type createSquadRequest struct {
	Name string `json:"name"`
}

func (h *SquadHandler) CreateSquad(w http.ResponseWriter, r *http.Request) {
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

	var req createSquadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		http.Error(w, "Squad name is required", http.StatusBadRequest)
		return
	}

	price := float64(config.GlobalSettings.GetInt("squad_creation_price", 50000))

	squadID, err := h.squadRepo.CreateSquadWithTx(r.Context(), tgID, req.Name, price)
	if err != nil {
		// Very basic error matching for unique violation or insufficient funds
		errStr := err.Error()
		if errStr == "insufficient funds" {
			http.Error(w, "Insufficient funds", http.StatusBadRequest)
			return
		}
		// A unique constraint violation from postgres typically contains "duplicate key value" or SQLSTATE 23505
		// For simplicity we just return a 400 Bad Request
		http.Error(w, "Failed to create squad. Name might be taken.", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"squad_id": squadID,
	})
}

type donateRequest struct {
	Amount float64 `json:"amount"`
}

func (h *SquadHandler) DonateToSquad(w http.ResponseWriter, r *http.Request) {
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

	var req donateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	err := h.squadRepo.DonateToSquad(r.Context(), tgID, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *SquadHandler) ActivateSquadBoost(w http.ResponseWriter, r *http.Request) {
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

	err := h.squadRepo.ActivateSquadBoost(r.Context(), tgID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
