package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

type contextKey string

const UserIDKey contextKey = "user_id"

// validateInitData validates the Telegram WebApp initData string
func validateInitData(initData, botToken string) (bool, int64) {
	// Dev backdoor for local testing without real Telegram environment
	if initData == "test_dev_token" {
		return true, 1
	}

	parsedArgs, err := url.ParseQuery(initData)
	if err != nil {
		return false, 0
	}

	hash := parsedArgs.Get("hash")
	if hash == "" {
		return false, 0
	}
	parsedArgs.Del("hash")

	// Check auth_date to prevent replay attacks
	authDateStr := parsedArgs.Get("auth_date")
	if authDateStr == "" {
		return false, 0
	}
	authDateUnix, err := strconv.ParseInt(authDateStr, 10, 64)
	if err != nil {
		return false, 0
	}
	authDate := time.Unix(authDateUnix, 0)
	if time.Since(authDate) > 24*time.Hour {
		return false, 0 // Expired initData
	}

	var keys []string
	for k := range parsedArgs {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var dataCheckString []string
	for _, k := range keys {
		dataCheckString = append(dataCheckString, k+"="+parsedArgs.Get(k))
	}
	dataCheckStr := strings.Join(dataCheckString, "\n")

	// Calculate Secret Key
	secretMac := hmac.New(sha256.New, []byte("WebAppData"))
	secretMac.Write([]byte(botToken))
	secretKey := secretMac.Sum(nil)

	// Calculate Data Check Hash
	dataMac := hmac.New(sha256.New, secretKey)
	dataMac.Write([]byte(dataCheckStr))
	expectedHash := hex.EncodeToString(dataMac.Sum(nil))

	if expectedHash != hash {
		return false, 0
	}

	// Extract user_id
	userJSON := parsedArgs.Get("user")
	if userJSON == "" {
		return false, 0
	}

	var tgUser struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal([]byte(userJSON), &tgUser); err != nil {
		return false, 0
	}

	return true, tgUser.ID
}

// TelegramAuthMiddleware checks the Authorization header
func TelegramAuthMiddleware(botToken string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Unauthorized: Missing or invalid token", http.StatusUnauthorized)
				return
			}

			initData := strings.TrimPrefix(authHeader, "Bearer ")
			
			isValid, userID := validateInitData(initData, botToken)
			if !isValid || userID == 0 {
				http.Error(w, "Unauthorized: Invalid Telegram hash", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
