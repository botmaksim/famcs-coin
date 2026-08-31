package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/repository"
)

type FeedbackHandler struct {
	feedbackRepo repository.FeedbackRepository
}

func NewFeedbackHandler(repo repository.FeedbackRepository) *FeedbackHandler {
	return &FeedbackHandler{feedbackRepo: repo}
}

func (h *FeedbackHandler) GetFeedbacks(w http.ResponseWriter, r *http.Request) {
	feedbacks, err := h.feedbackRepo.GetFeedbacks(r.Context())
	if err != nil {
		http.Error(w, "Failed to get feedbacks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feedbacks)
}

func (h *FeedbackHandler) CreateFeedback(w http.ResponseWriter, r *http.Request) {
	tgID, ok := r.Context().Value("tg_id").(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	err := h.feedbackRepo.CreateFeedback(r.Context(), tgID, req.Text)
	if err != nil {
		http.Error(w, "Failed to submit feedback", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
