package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"famcscoin-backend/internal/api"
	"famcscoin-backend/internal/bot"
	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/hub"
	"famcscoin-backend/internal/repository"
	"famcscoin-backend/internal/worker"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}
	config.InitEnvVars()

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8083"
	}
	botToken := strings.Trim(strings.TrimSpace(os.Getenv("TELEGRAM_BOT_TOKEN")), "\"")
	if botToken == "" {
		log.Println("WARNING: TELEGRAM_BOT_TOKEN is empty. Auth will fail.")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	database, err := db.NewDB(databaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Run migrations
	err = database.RunAllMigrations("./internal/db/migrations")
	if err != nil {
		log.Printf("Migration execution error: %v", err)
	}

	// Load initial settings cache
	if err := config.GlobalSettings.LoadFromDB(context.Background(), database.Pool); err != nil {
		log.Printf("Failed to load initial settings: %v", err)
	}

	// Workers
	go worker.StartEconomyWorker(context.Background(), database.Pool)

	// WebSockets Hub
	go hub.DefaultHub.Run()

	userRepo := repository.NewUserRepository(database.Pool)

	// Initialize Bot
	tgBot, err := bot.NewBot(botToken, userRepo)
	if err != nil {
		log.Printf("Failed to initialize telegram bot: %v", err)
	} else {
		go tgBot.Start(context.Background())
		log.Println("Telegram bot is running and listening for /start...")
	}

	// Configure router
	router := api.SetupRouter(database.Pool, botToken)

	log.Printf("FAMCS Coin API started on port %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Server launch error: %v", err)
	}
}