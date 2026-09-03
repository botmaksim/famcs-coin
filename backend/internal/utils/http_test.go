package utils

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHttpUtils(t *testing.T) {
	// 1. WriteJSON
	rec1 := httptest.NewRecorder()
	WriteJSON(rec1, http.StatusOK, map[string]string{"foo": "bar"})
	assert.Equal(t, http.StatusOK, rec1.Code)
	assert.Equal(t, "application/json", rec1.Header().Get("Content-Type"))
	assert.JSONEq(t, `{"foo":"bar"}`, rec1.Body.String())

	// 2. WriteError
	rec2 := httptest.NewRecorder()
	WriteError(rec2, http.StatusBadRequest, "bad request")
	assert.Equal(t, http.StatusBadRequest, rec2.Code)
	assert.JSONEq(t, `{"error":"bad request"}`, rec2.Body.String())

	// 3. ReadJSON
	var parsed map[string]string
	req := httptest.NewRequest("POST", "/test", bytes.NewBufferString(`{"hello":"world"}`))
	err := ReadJSON(req, &parsed)
	assert.NoError(t, err)
	assert.Equal(t, "world", parsed["hello"])
}
