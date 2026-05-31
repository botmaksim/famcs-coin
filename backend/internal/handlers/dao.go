package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type DaoHandler struct {
	daoRepo repository.DaoRepository
}

func NewDaoHandler(daoRepo repository.DaoRepository) *DaoHandler {
	return &DaoHandler{daoRepo: daoRepo}
}

func (h *DaoHandler) GetProposals(w http.ResponseWriter, r *http.Request) {
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

	proposals, err := h.daoRepo.GetActiveProposals(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to fetch proposals", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"proposals": proposals,
	})
}

type voteRequest struct {
	ProposalID int    `json:"proposal_id"`
	VoteType   string `json:"vote_type"`
}

func (h *DaoHandler) Vote(w http.ResponseWriter, r *http.Request) {
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

	var req voteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.VoteType != "up" && req.VoteType != "down" {
		http.Error(w, "Invalid vote type", http.StatusBadRequest)
		return
	}

	err := h.daoRepo.Vote(r.Context(), tgID, req.ProposalID, req.VoteType)
	if err != nil {
		errStr := err.Error()
		if errStr == "already voted" {
			http.Error(w, "You have already voted on this proposal", http.StatusConflict)
			return
		}
		if errStr == "proposal not found" {
			http.Error(w, "Proposal not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to cast vote", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
