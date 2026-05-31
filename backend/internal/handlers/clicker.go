package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type ClickerHandler struct {
	userRepo repository.UserRepository
}

func NewClickerHandler(userRepo repository.UserRepository) *ClickerHandler {
	return &ClickerHandler{userRepo: userRepo}
}

type clickRequest struct {
	Count int `json:"count"`
}

func (h *ClickerHandler) Click(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Достаем tg_id из контекста (положен middleware)
	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	var req clickRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Count <= 0 {
		http.Error(w, "Invalid count", http.StatusBadRequest)
		return
	}

	// TODO: Здесь должна быть более хитрая логика с energy и FOR UPDATE для кликов,
	// но для простоты обновляем баланс, если юзер найден. В идеале вызывать метод из Repo с логикой Energy.
	user, err := h.userRepo.GetUserByID(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Проверяем энергию (упрощенно)
	if user.Energy < req.Count {
		http.Error(w, "Not enough energy", http.StatusBadRequest)
		return
	}

	// Добавляем count к балансу (предположим 1 тап = 1 коин)
	err = h.userRepo.UpdateBalance(r.Context(), tgID, float64(req.Count))
	if err != nil {
		http.Error(w, "Failed to update balance", http.StatusInternalServerError)
		return
	}

	// Отправляем успешный ответ
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"added":   req.Count,
	})
}
