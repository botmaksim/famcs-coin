package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"famcscoin-backend/internal/api"
	"famcscoin-backend/internal/bot"
)

func main() {
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8083"
	}
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	go startBot(botToken)
	setupRoutes()
	fmt.Printf("FAMCS Coin API запущен на порту %s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}
}

func startBot(token string) {
	fmt.Printf("🤖 Telegram Бот инициализирован (Токен: %s...)\n", token[:5])
}

func setupRoutes() {
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok", "message": "Бэкенд ФПМИ готов к труду и обороне"}`))
	})
}