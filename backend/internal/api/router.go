package api

import (
	"net/http"

	"famcscoin-backend/internal/handlers"
	"famcscoin-backend/internal/middleware"
	"famcscoin-backend/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SetupRouter creates and returns the standard HTTP multiplexer with registered routes
func SetupRouter(pool *pgxpool.Pool, botToken string) http.Handler {
	mux := http.NewServeMux()

	// Initialize Repositories
	userRepo := repository.NewUserRepository(pool)
	shopRepo := repository.NewShopRepository(pool)
	squadRepo := repository.NewSquadRepository(pool)
	daoRepo := repository.NewDaoRepository(pool)
	taskRepo := repository.NewTaskRepository(pool)
	quizRepo := repository.NewQuizRepository(pool)
	betRepo := repository.NewBetRepository(pool)

	// Initialize Handlers
	userHandler := handlers.NewUserHandler(userRepo)
	clickerHandler := handlers.NewClickerHandler(userRepo)
	shopHandler := handlers.NewShopHandler(shopRepo)
	squadHandler := handlers.NewSquadHandler(squadRepo, userRepo)
	leaderboardHandler := handlers.NewLeaderboardHandler(userRepo)
	daoHandler := handlers.NewDaoHandler(daoRepo)
	taskHandler := handlers.NewTaskHandler(taskRepo)
	quizHandler := handlers.NewQuizHandler(quizRepo)
	adminHandler := handlers.NewAdminHandler(userRepo, betRepo)
	betHandler := handlers.NewBetHandler(betRepo)

	// Public Routes
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	})

	// Private Routes (Protected by TelegramAuthMiddleware)
	// Create a sub-mux or handler for protected routes
	protectedMux := http.NewServeMux()
	
	// User
	protectedMux.HandleFunc("POST /api/user/profile", userHandler.GetProfile)
	protectedMux.HandleFunc("GET /api/user/profile", userHandler.GetProfile)
	protectedMux.HandleFunc("POST /api/user/sleep", userHandler.Sleep)

	// Clicker
	protectedMux.HandleFunc("POST /api/user/click", clickerHandler.Click)
	
	// Shop
	protectedMux.HandleFunc("GET /api/shop/items", shopHandler.GetItems)
	protectedMux.HandleFunc("POST /api/shop/buy", shopHandler.Buy)
	protectedMux.HandleFunc("GET /api/shop/skins", shopHandler.GetSkins)
	protectedMux.HandleFunc("POST /api/shop/skins/buy", shopHandler.BuySkin)
	protectedMux.HandleFunc("POST /api/shop/skins/active", shopHandler.SetActiveSkin)

	// Squads
	protectedMux.HandleFunc("GET /api/squads", squadHandler.GetSquads)
	protectedMux.HandleFunc("POST /api/squads/join", squadHandler.JoinSquad)
	protectedMux.HandleFunc("POST /api/squads/create", squadHandler.CreateSquad)
	protectedMux.HandleFunc("POST /api/squads/donate", squadHandler.DonateToSquad)
	protectedMux.HandleFunc("POST /api/squads/boost", squadHandler.ActivateSquadBoost)

	// Leaderboard
	protectedMux.HandleFunc("GET /api/leaderboard/users", leaderboardHandler.GetUsers)

	// DAO
	protectedMux.HandleFunc("GET /api/dao/proposals", daoHandler.GetProposals)
	protectedMux.HandleFunc("POST /api/dao/vote", daoHandler.Vote)

	// Tasks
	protectedMux.HandleFunc("GET /api/tasks", taskHandler.GetTasks)
	protectedMux.HandleFunc("POST /api/tasks/claim", taskHandler.ClaimTask)

	// Quiz
	protectedMux.HandleFunc("GET /api/quiz/today", quizHandler.GetTodayQuiz)
	protectedMux.HandleFunc("POST /api/quiz/submit", quizHandler.SubmitAnswer)

	// Bets
	protectedMux.HandleFunc("GET /api/bets/active", betHandler.GetActive)
	protectedMux.HandleFunc("POST /api/bets/place", betHandler.PlaceBet)

	// Admin (Protected by Auth, but we'll wrap with RoleMiddleware per route below)
	// We handle role middleware selectively.
	// We'll create another mux or just wrap these individually.
	// Actually, let's just wrap the individual handlers.
	adminMux := http.NewServeMux()
	adminMux.Handle("POST /api/admin/bonus", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.BonusDrop)))
	adminMux.Handle("POST /api/admin/role", middleware.RoleMiddleware(userRepo, "superadmin")(http.HandlerFunc(adminHandler.UpdateRole)))
	adminMux.Handle("POST /api/admin/bets/resolve", middleware.RoleMiddleware(userRepo, "superadmin")(http.HandlerFunc(adminHandler.ResolveBet)))

	// Wrap protected routes with Auth Middleware
	authMiddleware := middleware.TelegramAuthMiddleware(botToken)
	
	// Mount protected routes to main mux
	mux.Handle("/api/user/", authMiddleware(protectedMux))
	mux.Handle("/api/shop/", authMiddleware(protectedMux))
	mux.Handle("/api/squads/", authMiddleware(protectedMux))
	mux.Handle("/api/squads", authMiddleware(protectedMux))
	mux.Handle("/api/leaderboard/", authMiddleware(protectedMux))
	mux.Handle("/api/dao/", authMiddleware(protectedMux))
	mux.Handle("/api/tasks", authMiddleware(protectedMux))
	mux.Handle("/api/tasks/", authMiddleware(protectedMux))
	mux.Handle("/api/quiz/", authMiddleware(protectedMux))
	mux.Handle("/api/bets/", authMiddleware(protectedMux))
	mux.Handle("/api/admin/", authMiddleware(adminMux))

	return middleware.LoggerMiddleware(middleware.CORSMiddleware(mux))
}
