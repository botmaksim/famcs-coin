package models

import (
	"time"
)

type User struct {
	TgID            int64      `json:"tg_id"`
	Username        string     `json:"username"`
	CustomName      *string    `json:"custom_name"`
	AvatarURL       *string    `json:"avatar_url"`
	Role            string     `json:"role"`
	Balance         float64    `json:"balance"`
	Energy          int        `json:"energy"`
	MaxEnergy       int        `json:"max_energy"`
	PassiveIncome   float64    `json:"passive_income"`
	IsHidden        bool       `json:"is_hidden"`
	LastActiveAt    *time.Time `json:"last_active_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Upgrade struct {
	ID              int     `json:"id"`
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	BasePrice       float64 `json:"base_price"`
	ProfitIncrease  float64 `json:"profit_increase"`
	ImageURL        string  `json:"image_url"`
}

type ShopItem struct {
	ID             int     `json:"id"`
	Title          string  `json:"title"`
	Description    string  `json:"description"`
	ProfitIncrease float64 `json:"profit_increase"`
	ImageURL       string  `json:"image_url"`
	Quantity       int     `json:"quantity"`
	Price          float64 `json:"price"`
}

type UserUpgrade struct {
	UserID    int64 `json:"user_id"`
	UpgradeID int   `json:"upgrade_id"`
	Quantity  int   `json:"quantity"`
}

type Transaction struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	Amount     float64   `json:"amount"`
	Type       string    `json:"type"`
	CreatedAt  time.Time `json:"created_at"`
}

type BetEvent struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Options        []string  `json:"options"`
	Status         string    `json:"status"`
	ClosesAt       time.Time `json:"closes_at"`
	WinningOption  *int      `json:"winning_option_index"`
	CreatedAt      time.Time `json:"created_at"`
	
	// Aggregated fields for frontend
	Pools          []float64 `json:"pools"`
	UserBetOption  *int      `json:"user_bet_option_index,omitempty"`
	UserBetAmount  *float64  `json:"user_bet_amount,omitempty"`
}

type UserBet struct {
	ID            int       `json:"id"`
	UserID        int64     `json:"user_id"`
	EventID       int       `json:"event_id"`
	OptionIndex   int       `json:"option_index"`
	Amount        float64   `json:"amount"`
	Payout        float64   `json:"payout"`
	CreatedAt     time.Time `json:"created_at"`
}

type Feedback struct {
	ID          int       `json:"id"`
	UserID      int64     `json:"user_id"`
	Text        string    `json:"text"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}
