package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"famcscoin-backend/internal/api"
	"famcscoin-backend/internal/bot"
	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/db"
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
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		log.Println("WARNING: TELEGRAM_BOT_TOKEN is empty. Auth will fail.")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	database, err := db.NewDB(databaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Запускаем миграции
	// В реальном приложении пути к миграциям стоит передавать конфигом, либо эмбеддить
	err = database.RunMigrations("./internal/db/migrations/0001_init.sql")
	if err != nil {
		log.Printf("Init migration error/skip: %v", err)
	}
	
	err = database.RunMigrations("./internal/db/migrations/0002_seed_shop.sql")
	if err != nil {
		log.Printf("Seed migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0003_game_settings.sql")
	if err != nil {
		log.Printf("Settings migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0004_seed_squads.sql")
	if err != nil {
		log.Printf("Squads seed migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0005_dao_init.sql")
	if err != nil {
		log.Printf("DAO migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0006_user_avatars.sql")
	if err != nil {
		log.Printf("Avatars migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0007_tasks.sql")
	if err != nil {
		log.Printf("Tasks migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0008_sleep_mechanic.sql")
	if err != nil {
		log.Printf("Sleep migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0009_daily_quiz.sql")
	if err != nil {
		log.Printf("Quiz migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0010_referrals.sql")
	if err != nil {
		log.Printf("Referrals migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0011_squad_treasury.sql")
	if err != nil {
		log.Printf("Treasury migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0012_admin_audit.sql")
	if err != nil {
		log.Printf("Admin Audit migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0013_skins.sql")
	if err != nil {
		log.Printf("Skins migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0014_betting.sql")
	if err != nil {
		log.Printf("Betting migration error/skip: %v", err)
	}
	err = database.RunMigrations("./internal/db/migrations/0015_admin_invites.sql")
	if err != nil {
		log.Printf("Admin invites migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0016_hall_of_fame.sql")
	if err != nil {
		log.Printf("Hall of fame migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0017_rbac_permissions.sql")
	if err != nil {
		log.Printf("RBAC permissions migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0018_dao_moderation.sql")
	if err != nil {
		log.Printf("DAO moderation migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0019_crypto_transactions.sql")
	if err != nil {
		log.Printf("Crypto transactions migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0020_ban_system.sql")
	if err != nil {
		log.Printf("Ban system migration error/skip: %v", err)
	}

	err = database.RunMigrations("./internal/db/migrations/0021_indexes_and_cleanup.sql")
	if err != nil {
		log.Printf("Indexes migration error/skip: %v", err)
	}

	// Загружаем настройки в кэш при старте
	if err := config.GlobalSettings.LoadFromDB(context.Background(), database.Pool); err != nil {
		log.Printf("Failed to load initial settings: %v", err)
	}

	// Воркеры
	go worker.StartEconomyWorker(context.Background(), database.Pool)

	cryptoRepo := repository.NewCryptoRepository(database.Pool)
	userRepo := repository.NewUserRepository(database.Pool)

	// Initialize Bot
	tgBot, err := bot.NewBot(botToken, userRepo, cryptoRepo)
	if err != nil {
		log.Printf("Failed to initialize telegram bot: %v", err)
	} else {
		go tgBot.Start(context.Background())
		log.Println("Telegram bot is running for /tip logic...")
	}

	// Настраиваем роутер
	router := api.SetupRouter(database.Pool, botToken)

	// Запуск HTTP Сервера (заглушка)
	go startBot(botToken)

	fmt.Printf("FAMCS Coin API запущен на порту %s\n", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}
}

func startBot(token string) {
	fmt.Printf("🤖 Telegram Бот инициализирован (Токен: %s...)\n", token[:5])
}