package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/hub"
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
	TgID        int64    `json:"tg_id"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
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

	err := h.userRepo.UpdateUserRoleAndPermissions(r.Context(), adminID, req.TgID, req.Role, req.Permissions)
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

	hub.Broadcast("bet_resolved", map[string]interface{}{
		"event_id":       req.EventID,
		"winning_option": req.WinningOption,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type generateInviteRequest struct {
	Role string `json:"role"`
}

func (h *AdminHandler) GenerateInvite(w http.ResponseWriter, r *http.Request) {
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

	var req generateInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Role != "admin" && req.Role != "superadmin" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	token, err := h.userRepo.GenerateAdminInvite(r.Context(), adminID, req.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
	})
}

type acceptInviteRequest struct {
	Token string `json:"token"`
	TgID  int64  `json:"tg_id"`
}

func (h *AdminHandler) AcceptInvite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req acceptInviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Token == "" || req.TgID == 0 {
		http.Error(w, "Missing token or tg_id", http.StatusBadRequest)
		return
	}

	err := h.userRepo.AcceptAdminInvite(r.Context(), req.Token, req.TgID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type banRequest struct {
	TgID     int64  `json:"tg_id"`
	Reason   string `json:"reason"`
	IsBanned bool   `json:"is_banned"`
}

func (h *AdminHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	settings := config.GlobalSettings.GetAll()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"settings": settings,
	})
}

type UpdateSettingRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"` // Stored as a simple string logic for easy update
}

func (h *AdminHandler) UpdateSetting(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UpdateSettingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.userRepo.UpdateGameSetting(r.Context(), req.Key, req.Value)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Fast reload setting
	_ = config.GlobalSettings.Reload(r.Context(), h.userRepo.Pool())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *AdminHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req banRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.TgID == 0 {
		http.Error(w, "Missing tg_id", http.StatusBadRequest)
		return
	}

	err := h.userRepo.BanUser(r.Context(), req.TgID, req.IsBanned, req.Reason)
	if err != nil {
		http.Error(w, "Failed to ban user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
