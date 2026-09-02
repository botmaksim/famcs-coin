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
	betRepo := repository.NewBetRepository(pool)
	feedbackRepo := repository.NewFeedbackRepository(pool)
	newsRepo := repository.NewNewsRepository(pool)

	// Initialize Handlers
	userHandler := handlers.NewUserHandler(userRepo)
	clickerHandler := handlers.NewClickerHandler(userRepo)
	shopHandler := handlers.NewShopHandler(shopRepo)
	leaderboardHandler := handlers.NewLeaderboardHandler(userRepo)
	adminHandler := handlers.NewAdminHandler(userRepo, betRepo, shopRepo, feedbackRepo)
	betHandler := handlers.NewBetHandler(betRepo)
	feedbackHandler := handlers.NewFeedbackHandler(feedbackRepo)
	newsHandler := handlers.NewNewsHandler(newsRepo, userRepo)

	// Public Routes
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok"}`))
	})
	
	// WebSocket
	mux.HandleFunc("GET /api/ws", handlers.ServeWS)

	// Private Routes (Protected by TMAAuthMiddleware)
	tmaAuth := middleware.TMAAuthMiddleware(botToken, userRepo)

	protectedMux := http.NewServeMux()
	
	// User
	protectedMux.HandleFunc("GET /api/user/profile", userHandler.GetProfile)
	protectedMux.HandleFunc("POST /api/user/settings", userHandler.UpdateSettings)

	// Clicker
	protectedMux.HandleFunc("POST /api/user/click", clickerHandler.Click)
	
	// Shop
	protectedMux.HandleFunc("GET /api/shop/items", shopHandler.GetItems)
	protectedMux.HandleFunc("POST /api/shop/buy", shopHandler.Buy)
	protectedMux.HandleFunc("POST /api/shop/sell", shopHandler.Sell)

	// Leaderboard
	protectedMux.HandleFunc("GET /api/leaderboard", leaderboardHandler.GetLeaderboard)

	// Feedback / Polls
	protectedMux.HandleFunc("GET /api/feedbacks", feedbackHandler.GetFeedbacks)
	protectedMux.HandleFunc("POST /api/feedbacks", feedbackHandler.CreateFeedback)

	// Bets
	protectedMux.HandleFunc("GET /api/bets", betHandler.GetBets)
	protectedMux.HandleFunc("POST /api/bets/place", betHandler.PlaceBet)

	// Admin
	adminMux := http.NewServeMux()
	adminMux.Handle("POST /api/admin/role", middleware.RequirePermission(userRepo, "superadmin")(http.HandlerFunc(adminHandler.UpdateRole)))
	adminMux.Handle("POST /api/admin/bets", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.CreateBet)))
	adminMux.Handle("POST /api/admin/bets/close", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.CloseBet)))
	adminMux.Handle("POST /api/admin/shop", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.CreateShopItem)))
	adminMux.Handle("DELETE /api/admin/shop", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.DeleteShopItem)))
	adminMux.Handle("POST /api/admin/feedback/status", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(adminHandler.UpdateFeedbackStatus)))
	adminMux.Handle("POST /api/admin/news", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.CreateNews)))
	adminMux.Handle("PUT /api/admin/news", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.UpdateNews)))
	adminMux.Handle("POST /api/admin/news/update", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.UpdateNews)))
	adminMux.Handle("POST /api/admin/news/close", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.ClosePoll)))
	adminMux.Handle("POST /api/admin/news/header", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.UpdateNewsHeader)))
	adminMux.Handle("DELETE /api/admin/news", middleware.RoleMiddleware(userRepo, "admin")(http.HandlerFunc(newsHandler.DeleteNews)))

	// Mount TMA routes to main mux
	mux.Handle("/api/user/", tmaAuth(protectedMux))
	mux.Handle("/api/shop/", tmaAuth(protectedMux))
	mux.Handle("/api/leaderboard", tmaAuth(protectedMux))
	mux.Handle("/api/feedbacks", tmaAuth(protectedMux))
	mux.Handle("/api/bets", tmaAuth(protectedMux))
	mux.Handle("/api/bets/", tmaAuth(protectedMux))

	// Mount Admin routes to main mux (using tmaAuth because admin is also accessed via TMA)
	mux.Handle("/api/admin/", tmaAuth(adminMux))

	// Public Web routes (No Auth required for reading leaderboards and polls)
	mux.HandleFunc("GET /api/web/leaderboard", leaderboardHandler.GetLeaderboard)
	mux.HandleFunc("GET /api/web/feedbacks", feedbackHandler.GetFeedbacks)

	// News / Development Ideas routes (Accessible on Web & TMA with optional auth)
	optionalAuth := middleware.OptionalAuthMiddleware(botToken)
	mux.Handle("GET /api/news", optionalAuth(http.HandlerFunc(newsHandler.GetNews)))
	mux.Handle("POST /api/news/vote", optionalAuth(http.HandlerFunc(newsHandler.VoteNews)))
	mux.Handle("GET /api/news/header", optionalAuth(http.HandlerFunc(newsHandler.GetNewsHeader)))

	return middleware.LoggerMiddleware(middleware.CORSMiddleware(mux))
}
