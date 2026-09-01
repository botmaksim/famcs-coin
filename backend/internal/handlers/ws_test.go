package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
)

func TestServeWS(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(ServeWS))
	defer server.Close()

	url := "ws" + strings.TrimPrefix(server.URL, "http")

	ws, _, err := websocket.DefaultDialer.Dial(url, nil)
	assert.NoError(t, err)
	defer ws.Close()

	err = ws.WriteMessage(websocket.TextMessage, []byte("hello"))
	assert.NoError(t, err)

	time.Sleep(10 * time.Millisecond)

	ws.Close()
}
