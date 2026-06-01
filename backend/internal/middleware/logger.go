package middleware

import (
	"log"
	"net/http"
	"time"
)

// responseWriter captures the status code for logging
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// LoggerMiddleware logs detailed information about each HTTP request
func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		
		// Attempt to extract UserID if it was added by auth middleware
		// Note: since LoggerMiddleware usually wraps the outermost mux, auth might not have run yet.
		// If we want to log UserID, we can log it inside the handlers, or just log the raw request here.
		
		log.Printf("[REQ] %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

		next.ServeHTTP(rw, r)

		duration := time.Since(start)
		log.Printf("[RES] %s %s | Status: %d | Duration: %v", r.Method, r.URL.Path, rw.status, duration)
	})
}
