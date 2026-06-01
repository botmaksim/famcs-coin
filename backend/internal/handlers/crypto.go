package handlers

import (
	"encoding/json"
	"net/http"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
)

type CryptoHandler struct {
	cryptoRepo repository.CryptoRepository
}

func NewCryptoHandler(cryptoRepo repository.CryptoRepository) *CryptoHandler {
	return &CryptoHandler{cryptoRepo: cryptoRepo}
}

type walletRequest struct {
	WalletAddress string `json:"wallet_address"`
}

func (h *CryptoHandler) UpdateWallet(w http.ResponseWriter, r *http.Request) {
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

	var req walletRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.WalletAddress == "" {
		http.Error(w, "Wallet address is required", http.StatusBadRequest)
		return
	}

	err := h.cryptoRepo.UpdateWalletAddress(r.Context(), tgID, req.WalletAddress)
	if err != nil {
		http.Error(w, "Failed to update wallet address", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

type withdrawRequest struct {
	Amount int64 `json:"amount"`
}

func (h *CryptoHandler) Withdraw(w http.ResponseWriter, r *http.Request) {
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

	var req withdrawRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	err := h.cryptoRepo.Withdraw(r.Context(), tgID, req.Amount)
	if err != nil {
		errStr := err.Error()
		if errStr == "no wallet address linked" {
			http.Error(w, "No wallet address linked", http.StatusBadRequest)
			return
		}
		if errStr == "insufficient balance" {
			http.Error(w, "Insufficient balance", http.StatusPaymentRequired)
			return
		}
		http.Error(w, "Failed to process withdrawal", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

func (h *CryptoHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
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

	history, err := h.cryptoRepo.GetCryptoHistory(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Failed to fetch crypto history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"history": history,
	})
}
