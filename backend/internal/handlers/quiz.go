package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type QuizHandler struct {
	quizRepo repository.QuizRepository
}

func NewQuizHandler(quizRepo repository.QuizRepository) *QuizHandler {
	return &QuizHandler{quizRepo: quizRepo}
}

func (h *QuizHandler) GetTodayQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	quiz, err := h.quizRepo.GetTodayQuiz(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to get quiz", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if quiz == nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"quiz": nil,
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"quiz": quiz,
	})
}

type submitQuizRequest struct {
	Answer string `json:"answer"`
}

func (h *QuizHandler) SubmitAnswer(w http.ResponseWriter, r *http.Request) {
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

	var req submitQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	isCorrect, newBalance, err := h.quizRepo.SubmitAnswer(r.Context(), tgID, req.Answer)
	if err != nil {
		if err.Error() == "already attempted" {
			http.Error(w, "Already attempted today", http.StatusConflict)
			return
		}
		if err.Error() == "no active quiz today" {
			http.Error(w, "No active quiz", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to submit answer", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"is_correct":  isCorrect,
		"new_balance": newBalance,
	})
}
