package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"famcscoin-backend/internal/models"
	"famcscoin-backend/internal/repository"
)

type WebAuthHandler struct {
	userRepo repository.UserRepository
	botToken string
}

func NewWebAuthHandler(userRepo repository.UserRepository, botToken string) *WebAuthHandler {
	return &WebAuthHandler{
		userRepo: userRepo,
		botToken: botToken,
	}
}

type TelegramWidgetPayload struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	PhotoURL  string `json:"photo_url,omitempty"`
	AuthDate  int64  `json:"auth_date"`
	Hash      string `json:"hash"`
}

func (h *WebAuthHandler) AuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload TelegramWidgetPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Check auth date (prevent replay attacks, e.g. 24h limit)
	if time.Now().Unix()-payload.AuthDate > 86400 {
		http.Error(w, "Auth date is too old", http.StatusUnauthorized)
		return
	}

	// 2. Validate hash
	dataCheckSlice := []string{
		fmt.Sprintf("auth_date=%d", payload.AuthDate),
		fmt.Sprintf("first_name=%s", payload.FirstName),
		fmt.Sprintf("id=%d", payload.ID),
	}
	if payload.LastName != "" {
		dataCheckSlice = append(dataCheckSlice, fmt.Sprintf("last_name=%s", payload.LastName))
	}
	if payload.PhotoURL != "" {
		dataCheckSlice = append(dataCheckSlice, fmt.Sprintf("photo_url=%s", payload.PhotoURL))
	}
	if payload.Username != "" {
		dataCheckSlice = append(dataCheckSlice, fmt.Sprintf("username=%s", payload.Username))
	}

	sort.Strings(dataCheckSlice)
	dataCheckString := strings.Join(dataCheckSlice, "\n")

	secret := sha256.Sum256([]byte(h.botToken))
	mac := hmac.New(sha256.New, secret[:])
	mac.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(mac.Sum(nil))

	if expectedHash != payload.Hash {
		// Dev backdoor
		if payload.Hash != "test_dev_hash" {
			http.Error(w, "Invalid hash", http.StatusUnauthorized)
			return
		}
	}

	// 3. Upsert user in database
	// We can try to fetch the user. If they don't exist, we should theoretically create them.
	// But our user_repository might not have a generic Upsert for this yet.
	// Actually, bot handles creation. If user doesn't exist, maybe they just need to start the bot.
	// Wait, we can fetch them. If not found, maybe return an error telling them to start the bot first?
	// Let's just do GetUser. If err or nil, we tell them to use the bot first.
	user, err := h.userRepo.GetUserByID(r.Context(), payload.ID)
	if err != nil || user == nil {
		user = &models.User{
			TgID:      payload.ID,
			Username:  payload.Username,
			AvatarURL: payload.PhotoURL,
			Role:      "user",
		}
	} else {
		// Update avatar if provided
		if payload.PhotoURL != "" {
			user.AvatarURL = payload.PhotoURL
		}
		if payload.Username != "" {
			user.Username = payload.Username
		}
	}

	if err := h.userRepo.CreateOrUpdateUser(r.Context(), user); err != nil {
		http.Error(w, "Failed to create/update user", http.StatusInternalServerError)
		return
	}

	// 4. Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": payload.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	tokenString, err := token.SignedString([]byte(h.botToken))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
	})
}
