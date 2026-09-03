package hub

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
)

var testUpgrader = websocket.Upgrader{}

func TestHub(t *testing.T) {
	go DefaultHub.Run()

	var serverConn *websocket.Conn
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var err error
		serverConn, err = testUpgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		DefaultHub.AddClient(serverConn)
	}))
	defer server.Close()

	url := "ws" + strings.TrimPrefix(server.URL, "http")
	ws, _, err := websocket.DefaultDialer.Dial(url, nil)
	assert.NoError(t, err)
	defer ws.Close()

	time.Sleep(50 * time.Millisecond)

	Broadcast("test_event", map[string]string{"msg": "hi"})

	var received Message
	err = ws.ReadJSON(&received)
	assert.NoError(t, err)
	assert.Equal(t, "test_event", received.Type)

	if serverConn != nil {
		DefaultHub.RemoveClient(serverConn)
	}

	time.Sleep(50 * time.Millisecond)

	DefaultHub.clientsMu.RLock()
	count := len(DefaultHub.clients)
	DefaultHub.clientsMu.RUnlock()
	assert.Equal(t, 0, count)
}
