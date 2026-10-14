# FAMCS-Coin: Telegram Mini App Clicker & Prediction Market

[![Go 1.22+](https://img.shields.io/badge/Go-1.22%2B-00ADD8.svg)](https://go.dev/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)
[![Telegram TMA](https://img.shields.io/badge/Telegram-Mini%20App-2CA5E0.svg)](https://core.telegram.org/bots/webapps)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

FAMCS-Coin is a high-load Telegram Mini App clicker game and event prediction market built for university community engagement. Engineered with a concurrent Go REST API, PostgreSQL database, and React frontend, the platform features transactional coin generation, shop upgrades, real-time betting, and global leaderboards.

---

## Table of Contents
1. [Platform Capabilities](#platform-capabilities)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Deployment](#deployment)
5. [Directory Structure](#directory-structure)
6. [License](#license)

---

## Platform Capabilities

* **Clicker Economy**: Low-latency coin generation with rate limiting and automated anti-cheat validation.
* **Event Betting**: Real-time prediction markets on university contests and community challenges.
* **Shop Upgrades**: Passive click income multipliers, stamina boosters, and cosmetic items.
* **Global Leaderboard**: Aggregated scoreboards ranking players by total volume and net worth.

---

## System Architecture

* **Backend Service**: Go daemon utilizing connection-pooled PostgreSQL queries and atomic transactions for balance integrity.
* **Client Frontend**: React 18 single-page application integrated with Telegram WebApp SDK for user authentication.
* **Containerization**: Docker Compose orchestrating database, backend, and frontend containers across production and test environments.

---

## Prerequisites

* Docker and Docker Compose
* Go 1.22+ and Node.js 20+ for native development

---

## Deployment

Deploy using Docker Compose:

```bash
git clone git@github.com:botmaksim/famcs-coin.git
cd famcs-coin

docker compose up --build -d
```

---

## Directory Structure

```text
famcs-coin/
├── docker-compose.yml       # Production stack orchestration
├── docker-compose.test.yml  # Integration test environment
├── Makefile                 # Build and migration targets
├── backend/                 # Go REST backend service
│   ├── main.go              # Server bootstrap and router
│   ├── handlers/            # Coin click, betting, and shop endpoints
│   └── db/                  # SQL queries and connection pool
└── frontend/                # React client application
    ├── src/                 # UI components and Telegram SDK bridge
    └── package.json         # Node.js dependencies
```

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
