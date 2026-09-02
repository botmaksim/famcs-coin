package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"famcscoin-backend/internal/repository"
)

type NewsHandler struct {
	newsRepo repository.NewsRepository
	userRepo repository.UserRepository
}

func NewNewsHandler(newsRepo repository.NewsRepository, userRepo repository.UserRepository) *NewsHandler {
	return &NewsHandler{newsRepo: newsRepo, userRepo: userRepo}
}

func (h *NewsHandler) getVoterID(r *http.Request) string {
	if tgID, ok := r.Context().Value("tg_id").(int64); ok && tgID > 0 {
		return fmt.Sprintf("tg:%d", tgID)
	}
	if headerVoter := r.Header.Get("X-Voter-ID"); headerVoter != "" {
		return strings.TrimSpace(headerVoter)
	}
	if queryVoter := r.URL.Query().Get("voter_id"); queryVoter != "" {
		return strings.TrimSpace(queryVoter)
	}
	return ""
}

func (h *NewsHandler) GetNews(w http.ResponseWriter, r *http.Request) {
	voterID := h.getVoterID(r)
	news, err := h.newsRepo.GetNews(r.Context(), voterID)
	if err != nil {
		http.Error(w, "Failed to get news", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(news)
}

func (h *NewsHandler) VoteNews(w http.ResponseWriter, r *http.Request) {
	var req struct {
		NewsID   int    `json:"news_id"`
		VoteType string `json:"vote_type"`
		VoterID  string `json:"voter_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	voterID := h.getVoterID(r)
	if voterID == "" {
		voterID = strings.TrimSpace(req.VoterID)
	}
	if voterID == "" {
		http.Error(w, "Voter ID required", http.StatusBadRequest)
		return
	}

	likes, dislikes, userVote, err := h.newsRepo.VoteNews(r.Context(), req.NewsID, voterID, req.VoteType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "ok",
		"news_id":        req.NewsID,
		"likes_count":    likes,
		"dislikes_count": dislikes,
		"user_vote":      userVote,
	})
}

func (h *NewsHandler) CreateNews(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title    string  `json:"title"`
		Content  string  `json:"content"`
		ImageURL *string `json:"image_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		http.Error(w, "Title and content required", http.StatusBadRequest)
		return
	}

	item, err := h.newsRepo.CreateNews(r.Context(), req.Title, req.Content, req.ImageURL)
	if err != nil {
		http.Error(w, "Failed to create news", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *NewsHandler) UpdateNews(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       int     `json:"id"`
		Title    string  `json:"title"`
		Content  string  `json:"content"`
		ImageURL *string `json:"image_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID <= 0 {
		http.Error(w, "Invalid input or ID", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		http.Error(w, "Title and content required", http.StatusBadRequest)
		return
	}

	item, err := h.newsRepo.UpdateNews(r.Context(), req.ID, req.Title, req.Content, req.ImageURL)
	if err != nil {
		http.Error(w, "Failed to update news", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func (h *NewsHandler) DeleteNews(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		var req struct {
			ID int `json:"id"`
		}
		if errDecode := json.NewDecoder(r.Body).Decode(&req); errDecode == nil && req.ID > 0 {
			id = req.ID
		} else {
			http.Error(w, "Valid ID required", http.StatusBadRequest)
			return
		}
	}

	if err := h.newsRepo.DeleteNews(r.Context(), id); err != nil {
		http.Error(w, "Failed to delete news", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
