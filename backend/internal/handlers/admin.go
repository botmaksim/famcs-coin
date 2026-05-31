package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type AdminHandler struct {
	userRepo repository.UserRepository
	betRepo  repository.BetRepository
}

func NewAdminHandler(userRepo repository.UserRepository, betRepo repository.BetRepository) *AdminHandler {
	return &AdminHandler{
		userRepo: userRepo,
		betRepo:  betRepo,
	}
}

type bonusRequest struct {
	TgID   int64   `json:"tg_id"`
	Amount float64 `json:"amount"`
}

func (h *AdminHandler) BonusDrop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	adminID := ctxValue.(int64)

	var req bonusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	err := h.userRepo.BonusDrop(r.Context(), adminID, req.TgID, req.Amount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type roleRequest struct {
	TgID int64  `json:"tg_id"`
	Role string `json:"role"`
}

func (h *AdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	adminID := ctxValue.(int64)

	var req roleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Role != "user" && req.Role != "admin" && req.Role != "superadmin" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	err := h.userRepo.UpdateUserRole(r.Context(), adminID, req.TgID, req.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type resolveBetRequest struct {
	EventID       int    `json:"event_id"`
	WinningOption string `json:"winning_option"`
}

func (h *AdminHandler) ResolveBet(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	adminID := ctxValue.(int64)

	var req resolveBetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.WinningOption != "A" && req.WinningOption != "B" && req.WinningOption != "cancel" {
		http.Error(w, "Invalid winning_option", http.StatusBadRequest)
		return
	}

	err := h.betRepo.ResolveEvent(r.Context(), adminID, req.EventID, req.WinningOption)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

