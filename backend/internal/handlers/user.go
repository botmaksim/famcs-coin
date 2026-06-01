package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/models"
	"famcscoin-backend/internal/repository"
)

type UserHandler struct {
	userRepo repository.UserRepository
}

func NewUserHandler(userRepo repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

type getProfileRequest struct {
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Username   string `json:"username"`
	PhotoURL   string `json:"photo_url"`
	StartParam string `json:"start_param"`
}

// GetProfile returns the user profile, or creates a new one if it doesn't exist.
// It accepts POST request with Telegram user data to keep username and avatar up to date.
func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctxValue := r.Context().Value(middleware.UserIDKey)
	if ctxValue == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	tgID := ctxValue.(int64)

	var req getProfileRequest
	if r.Method == http.MethodPost {
		json.NewDecoder(r.Body).Decode(&req)
	}

	user, err := h.userRepo.GetUserByID(r.Context(), tgID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Auto-registration or updating existing user logic
	computedUsername := req.Username
	if computedUsername == "" {
		if req.FirstName != "" {
			computedUsername = req.FirstName + " " + req.LastName
		} else {
			computedUsername = fmt.Sprintf("User_%d", tgID)
		}
	}

	if user == nil {
		var referredBy *int64
		if req.StartParam != "" {
			var refID int64
			// start_param looks like "ref_123456"
			if _, err := fmt.Sscanf(req.StartParam, "ref_%d", &refID); err == nil && refID != tgID {
				referredBy = &refID
			}
		}

		// New User
		user = &models.User{
			TgID:       tgID,
			Username:   computedUsername,
			AvatarURL:  req.PhotoURL,
			Role:       "user",
			Energy:     1000,
			MaxEnergy:  1000,
			ReferredBy: referredBy,
		}
		
		err = h.userRepo.CreateOrUpdateUser(r.Context(), user)
		if err != nil {
			http.Error(w, "Failed to register user", http.StatusInternalServerError)
			return
		}
		user, _ = h.userRepo.GetUserByID(r.Context(), tgID)
	} else if r.Method == http.MethodPost && (user.AvatarURL != req.PhotoURL || user.Username != computedUsername) {
		// Existing User, but need to update avatar or username
		user.Username = computedUsername
		if req.PhotoURL != "" {
			user.AvatarURL = req.PhotoURL
		}
		err = h.userRepo.CreateOrUpdateUser(r.Context(), user)
		if err == nil {
			user, _ = h.userRepo.GetUserByID(r.Context(), tgID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) Sleep(w http.ResponseWriter, r *http.Request) {
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

	// Timezone check: using UTC+3 (Moscow/Minsk)
	loc, err := time.LoadLocation("Europe/Moscow")
	if err != nil {
		loc = time.FixedZone("UTC+3", 3*60*60)
	}

	now := time.Now().In(loc)
	hour := now.Hour()
	minute := now.Minute()

	// Allowed interval: 21:45 to 22:00
	isAllowedTime := (hour == 21 && minute >= 45) || (hour == 22 && minute == 0)

	if !isAllowedTime {
		http.Error(w, "Too early or too late to sleep", http.StatusForbidden)
		return
	}

	// Calculate target wake up time: 8 hours from now
	sleepUntil := now.Add(8 * time.Hour)

	// Update user in DB
	err = h.userRepo.UpdateSleepUntil(r.Context(), tgID, &sleepUntil)
	if err != nil {
		http.Error(w, "Failed to update sleep status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"sleep_until": sleepUntil,
	})
}
