package handlers

import (
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
	"famcscoin-backend/internal/utils"
)

type DaoHandler struct {
	daoRepo repository.DaoRepository
}

func NewDaoHandler(daoRepo repository.DaoRepository) *DaoHandler {
	return &DaoHandler{daoRepo: daoRepo}
}

func (h *DaoHandler) GetProposals(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tgID := ctxValue.(int64)

	proposals, err := h.daoRepo.GetActiveProposals(r.Context(), tgID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch proposals")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": proposals,
	})
}

type proposeRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

func (h *DaoHandler) Propose(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tgID := ctxValue.(int64)

	var req proposeRequest
	if err := utils.ReadJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.Title == "" || req.Description == "" {
		utils.WriteError(w, http.StatusBadRequest, "Title and description are required")
		return
	}

	// Assuming a fixed pledge amount of 1000
	pledgeAmount := 1000.0

	err := h.daoRepo.Propose(r.Context(), tgID, req.Title, req.Description, pledgeAmount)
	if err != nil {
		if err.Error() == "insufficient balance" {
			utils.WriteError(w, http.StatusPaymentRequired, "Insufficient balance for pledge")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to submit proposal")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

type voteRequest struct {
	ProposalID int    `json:"proposal_id"`
	VoteType   string `json:"vote_type"`
}

func (h *DaoHandler) Vote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tgID := ctxValue.(int64)

	var req voteRequest
	if err := utils.ReadJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.VoteType != "up" && req.VoteType != "down" {
		utils.WriteError(w, http.StatusBadRequest, "Invalid vote type")
		return
	}

	err := h.daoRepo.Vote(r.Context(), tgID, req.ProposalID, req.VoteType)
	if err != nil {
		errStr := err.Error()
		if errStr == "already voted" {
			utils.WriteError(w, http.StatusConflict, "You have already voted on this proposal")
			return
		}
		if errStr == "proposal not found" {
			utils.WriteError(w, http.StatusNotFound, "Proposal not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to cast vote")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}

func (h *DaoHandler) GetPendingProposals(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	proposals, err := h.daoRepo.GetPendingProposals(r.Context())
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch pending proposals")
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": proposals,
	})
}

type moderateRequest struct {
	ProposalID int    `json:"proposal_id"`
	Decision   string `json:"decision"`
}

func (h *DaoHandler) ModerateProposal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req moderateRequest
	if err := utils.ReadJSON(r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.Decision != "approve" && req.Decision != "reject" {
		utils.WriteError(w, http.StatusBadRequest, "Invalid decision")
		return
	}

	err := h.daoRepo.ModerateProposal(r.Context(), req.ProposalID, req.Decision)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
	})
}
