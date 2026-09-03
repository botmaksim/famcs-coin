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
		// Skip noisy high-frequency endpoints (e.g. clicker requests and health checks)
		isHighFreq := r.URL.Path == "/api/user/click" || r.URL.Path == "/api/health" || r.URL.Path == "/api/ws"

		start := time.Now()

		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		
		if !isHighFreq {
			log.Printf("[REQ] %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		}

		next.ServeHTTP(rw, r)

		if !isHighFreq || rw.status >= 400 {
			duration := time.Since(start)
			log.Printf("[RES] %s %s | Status: %d | Duration: %v", r.Method, r.URL.Path, rw.status, duration)
		}
	})
}
