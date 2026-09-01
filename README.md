# FAMCS Coin 

A Telegram Mini App clicker game with event betting, shop upgrades, and a public leaderboard. Built with React, Go, and PostgreSQL.

##  Stack
- **Frontend:** React (Vite), Tailwind CSS 4, TMA SDK
- **Backend:** Go 1.25, pgx, Telegram Bot API
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker, Cloudflare Tunnel (for testing)

##  How to run locally (Development)
1. Install dependencies in `/frontend` and `/backend`.
2. Configure your database and `.env`.
3. Run the backend: `cd backend && go run main.go`
4. Run the frontend: `cd frontend && npm run dev`

##  How to run in Docker for testing (with automatic HTTPS)
Perfect for testing inside Telegram as a TMA:
1. Fill in your `.env` file (ensure `TG_BOT_TOKEN` is set).
2. Run `docker compose -f docker-compose.test.yml up -d --build`
3. Find your temporary HTTPS URL by running: `docker compose -f docker-compose.test.yml logs tunnel | grep "https://"`
4. Paste this URL into your bot's WebApp settings via BotFather.

##  How to run in Production
1. Configure your DNS A-record to point to your server (e.g., `coin.mybsu.online`).
2. Run `docker compose -f docker-compose.prod.yml up -d --build`.
3. Configure Nginx/Caddy on your host machine to reverse proxy traffic to `127.0.0.1:8000` and issue an SSL certificate via Certbot.