package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"famcscoin-backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	RoleKey   contextKey = "role"
)

// validateInitData validates the Telegram WebApp initData string
func validateInitData(initData, botToken string) (bool, int64) {
	log.Printf("[AUTH DEBUG] validateInitData called. Raw initData: %q, botToken len: %d", initData, len(botToken))

	// Web Admin simple authentication using ADMIN_PANEL_PASSWORD
	if strings.HasPrefix(initData, "web:") {
		parts := strings.Split(initData, ":")
		if len(parts) == 3 {
			tgIDStr := parts[1]
			password := parts[2]
			expectedPassword := os.Getenv("ADMIN_PANEL_PASSWORD")
			if expectedPassword != "" && password == expectedPassword {
				tgID, err := strconv.ParseInt(tgIDStr, 10, 64)
				if err == nil {
					log.Printf("[AUTH DEBUG] Web Admin authenticated with tgID: %d", tgID)
					return true, tgID
				}
			}
		}
	}

	parsedArgs, err := url.ParseQuery(initData)
	if err != nil {
		log.Printf("[AUTH DEBUG] url.ParseQuery error: %v", err)
		return false, 0
	}

	hash := parsedArgs.Get("hash")
	if hash == "" {
		log.Printf("[AUTH DEBUG] Hash is missing in initData! Keys present: %v", parsedArgs)
		return false, 0
	}
	parsedArgs.Del("hash")

	// Check auth_date to prevent replay attacks
	authDateStr := parsedArgs.Get("auth_date")
	if authDateStr == "" {
		log.Printf("[AUTH DEBUG] auth_date is missing in initData")
		return false, 0
	}
	authDateUnix, err := strconv.ParseInt(authDateStr, 10, 64)
	if err != nil {
		log.Printf("[AUTH DEBUG] auth_date parse error: %v", err)
		return false, 0
	}
	authDate := time.Unix(authDateUnix, 0)
	if time.Since(authDate) > 24*time.Hour {
		log.Printf("[AUTH DEBUG] Auth Failed! Session expired. authDate: %v, timeNow: %v", authDate, time.Now())
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
		log.Printf("[AUTH DEBUG] Hash mismatch! Expected: %s, Got: %s", expectedHash, hash)
		log.Printf("[AUTH DEBUG] DataCheckStr:\n%s", dataCheckStr)
		log.Printf("[AUTH DEBUG] BotToken used (first 6 and last 4 chars): %s...%s (total len %d)", 
			botToken[:min(6, len(botToken))], 
			botToken[max(0, len(botToken)-4):], 
			len(botToken))
		return false, 0
	}

	// Extract user_id
	userJSON := parsedArgs.Get("user")
	if userJSON == "" {
		log.Printf("[AUTH DEBUG] 'user' param is missing in initData")
		return false, 0
	}

	var tgUser struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal([]byte(userJSON), &tgUser); err != nil {
		log.Printf("[AUTH DEBUG] Failed to unmarshal user JSON: %v", err)
		return false, 0
	}

	log.Printf("[AUTH DEBUG] Validation successful for UserID: %d", tgUser.ID)
	return true, tgUser.ID
}

// TMAAuthMiddleware checks 'tma' Authorization header, and falls back to JWT/Web token if present
func TMAAuthMiddleware(botToken string, userRepo repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			
			// Fallback to WebAuth logic
			if authHeader == "" || !strings.HasPrefix(authHeader, "tma ") {
				log.Printf("[AUTH DEBUG] Missing or non-tma header: %q. Falling back to WebAuth", authHeader)
				webAuthFunc := WebAuthMiddleware(botToken, userRepo)(next)
				webAuthFunc.ServeHTTP(w, r)
				return
			}

			initData := strings.TrimPrefix(authHeader, "tma ")
			isValid, userID := validateInitData(initData, botToken)
			if !isValid || userID == 0 {
				log.Printf("[AUTH DEBUG] TMA auth validation returned false for header")
				http.Error(w, "Unauthorized: Invalid TMA hash", http.StatusUnauthorized)
				return
			}

			user, err := userRepo.GetUserByID(r.Context(), userID)
			if err != nil || user == nil {
				// Initial login, grant user role
				ctx := context.WithValue(r.Context(), UserIDKey, userID)
				ctx = context.WithValue(ctx, RoleKey, "user")
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}



			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, RoleKey, user.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// WebAuthMiddleware checks ONLY the 'Bearer' Authorization header
func WebAuthMiddleware(botToken string, userRepo repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				log.Printf("[AUTH DEBUG] WebAuth rejected: authHeader is %q", authHeader)
				http.Error(w, "Unauthorized: Missing or invalid Bearer header", http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			var parsedUserID int64

			// Try JWT
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method")
				}
				return []byte(botToken), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if userIDFloat, ok := claims["user_id"].(float64); ok {
						parsedUserID = int64(userIDFloat)
					}
				}
			}

			// Try Web Admin Password as fallback (web:tg_id:password)
			if parsedUserID == 0 {
				isValid, id := validateInitData(tokenStr, botToken)
				if isValid && id != 0 {
					parsedUserID = id
				}
			}

			if parsedUserID == 0 {
				http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
				return
			}

			user, err := userRepo.GetUserByID(r.Context(), parsedUserID)
			if err != nil || user == nil {
				ctx := context.WithValue(r.Context(), UserIDKey, parsedUserID)
				ctx = context.WithValue(ctx, RoleKey, "user")
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}



			ctx := context.WithValue(r.Context(), UserIDKey, parsedUserID)
			ctx = context.WithValue(ctx, RoleKey, user.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
