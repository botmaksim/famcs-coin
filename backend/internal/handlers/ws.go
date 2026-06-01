package handlers

import (
	"log"
	"net/http"

	"famcscoin-backend/internal/hub"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for the WS connection
	},
}

func ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WS Upgrade Error:", err)
		return
	}
	hub.DefaultHub.AddClient(conn)

	// Keep the connection alive
	defer func() {
		hub.DefaultHub.RemoveClient(conn)
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
