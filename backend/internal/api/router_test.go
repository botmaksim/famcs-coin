package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSetupRouter_Health(t *testing.T) {
	// SetupRouter accepts nil pool for routing test, or we can test health endpoint
	router := SetupRouter(nil, "dummy-token")
	assert.NotNil(t, router)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.JSONEq(t, `{"status": "ok"}`, rec.Body.String())
}
