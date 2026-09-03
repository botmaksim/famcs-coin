package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/models"
	"famcscoin-backend/internal/repository"
)

type AdminHandler struct {
	userRepo     repository.UserRepository
	betRepo      repository.BetRepository
	shopRepo     repository.ShopRepository
	feedbackRepo repository.FeedbackRepository
}

func NewAdminHandler(u repository.UserRepository, b repository.BetRepository, s repository.ShopRepository, f repository.FeedbackRepository) *AdminHandler {
	return &AdminHandler{
		userRepo:     u,
		betRepo:      b,
		shopRepo:     s,
		feedbackRepo: f,
	}
}

func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	limit := 50
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	users, err := h.userRepo.SearchUsers(r.Context(), query, limit)
	if err != nil {
		http.Error(w, "Failed to search users", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []models.User{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *AdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TgID int64  `json:"tg_id"`
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if req.Role != "user" && req.Role != "admin" && req.Role != "superadmin" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	// Prevent self-demotion
	requesterID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if ok && requesterID == req.TgID && req.Role != "superadmin" {
		http.Error(w, "Cannot demote your own superadmin account", http.StatusBadRequest)
		return
	}

	err := h.userRepo.UpdateRole(r.Context(), req.TgID, req.Role)
	if err != nil {
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) CreateBet(w http.ResponseWriter, r *http.Request) {
	var req models.BetEvent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.betRepo.CreateBet(r.Context(), &req)
	if err != nil {
		http.Error(w, "Failed to create bet", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) CloseBet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EventID       int `json:"event_id"`
		WinningOption int `json:"winning_option_index"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.betRepo.CloseBet(r.Context(), req.EventID, req.WinningOption)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) CreateShopItem(w http.ResponseWriter, r *http.Request) {
	var req models.Upgrade
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.CreateItem(r.Context(), &req)
	if err != nil {
		http.Error(w, "Failed to create shop item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeleteShopItem(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UpgradeID int `json:"upgrade_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.shopRepo.DeleteItem(r.Context(), req.UpgradeID)
	if err != nil {
		http.Error(w, "Failed to delete shop item", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) UpdateFeedbackStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FeedbackID int    `json:"feedback_id"`
		Status     string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.feedbackRepo.UpdateStatus(r.Context(), req.FeedbackID, req.Status)
	if err != nil {
		http.Error(w, "Failed to update feedback status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeleteFeedback(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FeedbackID int `json:"feedback_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.feedbackRepo.DeleteFeedback(r.Context(), req.FeedbackID)
	if err != nil {
		http.Error(w, "Failed to delete feedback", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
