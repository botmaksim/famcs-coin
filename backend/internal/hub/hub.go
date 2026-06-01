package hub

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[*websocket.Conn]bool
	clientsMu  sync.RWMutex
	broadcast  chan Message
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

var DefaultHub = &Hub{
	broadcast:  make(chan Message),
	register:   make(chan *websocket.Conn),
	unregister: make(chan *websocket.Conn),
	clients:    make(map[*websocket.Conn]bool),
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clientsMu.Lock()
			h.clients[client] = true
			h.clientsMu.Unlock()
			log.Println("New WebSocket client connected")
		case client := <-h.unregister:
			h.clientsMu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.clientsMu.Unlock()
			log.Println("WebSocket client disconnected")
		case message := <-h.broadcast:
			h.clientsMu.RLock()
			for client := range h.clients {
				err := client.WriteJSON(message)
				if err != nil {
					log.Printf("WS emit error: %v", err)
					client.Close()
					delete(h.clients, client)
				}
			}
			h.clientsMu.RUnlock()
		}
	}
}

func (h *Hub) AddClient(conn *websocket.Conn) {
	h.register <- conn
}

func (h *Hub) RemoveClient(conn *websocket.Conn) {
	h.unregister <- conn
}

func Broadcast(msgType string, payload interface{}) {
	DefaultHub.broadcast <- Message{
		Type:    msgType,
		Payload: payload,
	}
}
