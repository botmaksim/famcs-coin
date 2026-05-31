package middleware

import (
	"net/http"

	"famcscoin-backend/internal/repository"
)

// RoleMiddleware checks if the user has the required role or higher
// Hierarchy: superadmin > admin > user
func RoleMiddleware(userRepo repository.UserRepository, requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctxValue := r.Context().Value(UserIDKey)
			if ctxValue == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			tgID := ctxValue.(int64)

			user, err := userRepo.GetUserByID(r.Context(), tgID)
			if err != nil || user == nil {
				http.Error(w, "User not found", http.StatusUnauthorized)
				return
			}

			hasAccess := false
			switch requiredRole {
			case "superadmin":
				hasAccess = (user.Role == "superadmin")
			case "admin":
				hasAccess = (user.Role == "admin" || user.Role == "superadmin")
			case "user":
				hasAccess = true // Everyone registered is at least a user
			}

			if !hasAccess {
				http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
