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
	cryptoRepo := repository.NewCryptoRepository(pool)

	// Initialize Handlers
	userHandler := handlers.NewUserHandler(userRepo)
	clickerHandler := handlers.NewClickerHandler(userRepo)
	shopHandler := handlers.NewShopHandler(shopRepo)
	squadHandler := handlers.NewSquadHandler(squadRepo, userRepo)
	leaderboardHandler := handlers.NewLeaderboardHandler(userRepo)
	daoHandler := handlers.NewDaoHandler(daoRepo)
	taskHandler := handlers.NewTaskHandler(taskRepo)
	taskAdminHandler := handlers.NewTaskAdminHandler(taskRepo)
	quizHandler := handlers.NewQuizHandler(quizRepo)
	adminHandler := handlers.NewAdminHandler(userRepo, betRepo)
	betHandler := handlers.NewBetHandler(betRepo)
	cryptoHandler := handlers.NewCryptoHandler(cryptoRepo)
	webPublicHandler := handlers.NewWebPublicHandler(userRepo, squadRepo)
	webAuthHandler := handlers.NewWebAuthHandler(userRepo, botToken)

	// Public Routes
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	})
	
	// WebSocket
	mux.HandleFunc("GET /api/ws", handlers.ServeWS)

	// Private Routes (Protected by TMAAuthMiddleware)
	tmaAuth := middleware.TMAAuthMiddleware(botToken, userRepo)
	webAuth := middleware.WebAuthMiddleware(botToken, userRepo)

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
	protectedMux.HandleFunc("GET /api/leaderboard/tippers", leaderboardHandler.GetTippers)

	// DAO
	protectedMux.HandleFunc("GET /api/dao/proposals", daoHandler.GetProposals)
	protectedMux.HandleFunc("POST /api/dao/propose", daoHandler.Propose)
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

	// Crypto
	protectedMux.HandleFunc("POST /api/crypto/wallet", cryptoHandler.UpdateWallet)
	protectedMux.HandleFunc("POST /api/crypto/withdraw", cryptoHandler.Withdraw)
	protectedMux.HandleFunc("GET /api/crypto/history", cryptoHandler.GetHistory)

	// Admin (Protected by Auth, but we'll wrap with RoleMiddleware per route below)
	// We handle role middleware selectively.
	// We'll create another mux or just wrap these individually.
	// Actually, let's just wrap the individual handlers.
	adminMux := http.NewServeMux()
	adminMux.Handle("POST /api/admin/bonus", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.BonusDrop)))
	adminMux.Handle("POST /api/admin/role", middleware.RequirePermission(userRepo, "superadmin")(http.HandlerFunc(adminHandler.UpdateRole)))
	adminMux.Handle("POST /api/admin/users/ban", middleware.RequirePermission(userRepo, "ban_users")(http.HandlerFunc(adminHandler.BanUser)))
	adminMux.Handle("POST /api/admin/bets/resolve", middleware.RoleMiddleware(userRepo, "superadmin")(http.HandlerFunc(adminHandler.ResolveBet)))
	adminMux.Handle("POST /api/admin/generate_invite", middleware.RoleMiddleware(userRepo, "superadmin")(http.HandlerFunc(adminHandler.GenerateInvite)))
	adminMux.Handle("GET /api/admin/settings", middleware.RoleMiddleware(userRepo, "superadmin")(http.HandlerFunc(adminHandler.GetSettings)))
	adminMux.Handle("PUT /api/admin/settings", middleware.RequirePermission(userRepo, "superadmin")(http.HandlerFunc(adminHandler.UpdateSetting)))

	// Tasks admin
	adminMux.Handle("GET /api/admin/tasks", middleware.RequirePermission(userRepo, "manage_tasks")(http.HandlerFunc(taskAdminHandler.GetTasks)))
	adminMux.Handle("POST /api/admin/tasks", middleware.RequirePermission(userRepo, "manage_tasks")(http.HandlerFunc(taskAdminHandler.CreateTask)))
	adminMux.Handle("PUT /api/admin/tasks/", middleware.RequirePermission(userRepo, "manage_tasks")(http.HandlerFunc(taskAdminHandler.UpdateTask)))
	adminMux.Handle("DELETE /api/admin/tasks/", middleware.RequirePermission(userRepo, "manage_tasks")(http.HandlerFunc(taskAdminHandler.DeleteTask)))

	// DAO admin
	adminMux.Handle("GET /api/admin/dao/pending", middleware.RequirePermission(userRepo, "moderate_dao")(http.HandlerFunc(daoHandler.GetPendingProposals)))
	adminMux.Handle("POST /api/admin/dao/moderate", middleware.RequirePermission(userRepo, "moderate_dao")(http.HandlerFunc(daoHandler.ModerateProposal)))

	// Public routes
	mux.HandleFunc("POST /api/admin/accept_invite", adminHandler.AcceptInvite)

	// Web Public Routes
	mux.HandleFunc("GET /api/web/leaderboard/players", webPublicHandler.GetLeaderboardPlayers)
	mux.HandleFunc("GET /api/web/leaderboard/squads", webPublicHandler.GetLeaderboardSquads)
	mux.HandleFunc("GET /api/web/leaderboard/tippers", webPublicHandler.GetLeaderboardTippers)
	mux.HandleFunc("GET /api/web/hall_of_fame", webPublicHandler.GetHallOfFame)
	mux.HandleFunc("GET /api/web/config", webPublicHandler.GetPublicConfig)
	mux.HandleFunc("POST /api/web/auth", webAuthHandler.AuthCallback)

	// Wrap protected routes with Auth Middlewares
	
	// Mount TMA routes to main mux
	mux.Handle("/api/user/", tmaAuth(protectedMux))
	mux.Handle("/api/shop/", tmaAuth(protectedMux))
	mux.Handle("/api/squads/", tmaAuth(protectedMux))
	mux.Handle("/api/squads", tmaAuth(protectedMux))
	mux.Handle("/api/leaderboard/", tmaAuth(protectedMux))
	mux.Handle("/api/dao/", tmaAuth(protectedMux))
	mux.Handle("/api/tasks", tmaAuth(protectedMux))
	mux.Handle("/api/tasks/", tmaAuth(protectedMux))
	mux.Handle("/api/quiz/", tmaAuth(protectedMux))
	mux.Handle("/api/bets/", tmaAuth(protectedMux))
	mux.Handle("/api/crypto/", tmaAuth(protectedMux))
	
	// Mount Admin/Web routes to main mux
	mux.Handle("/api/admin/", webAuth(adminMux))

	return middleware.LoggerMiddleware(middleware.CORSMiddleware(mux))
}
