package models

import (
	"time"
)

type Squad struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	TotalPoints      float64    `json:"total_points"`
	TreasuryBalance float64    `json:"treasury_balance"`
	BoostUntil      *time.Time `json:"boost_until"`
}

type User struct {
	TgID            int64      `json:"tg_id"`
	Username        string     `json:"username"`
	CustomName      *string    `json:"custom_name"`
	AvatarURL       string     `json:"avatar_url"`
	Role            string     `json:"role"`
	Balance         float64    `json:"balance"`
	Energy          int        `json:"energy"`
	MaxEnergy       int        `json:"max_energy"`
	PassiveIncome   float64    `json:"passive_income"`
	SquadID         *int       `json:"squad_id"`
	ActiveSkinURL   *string    `json:"active_skin_url,omitempty"`
	IsHidden        bool       `json:"is_hidden"`
	IsAnonymousTips bool       `json:"is_anonymous_tips"`
	ReferredBy      *int64     `json:"referred_by,omitempty"`
	SleepUntil      *time.Time `json:"sleep_until,omitempty"`
	SuspendedAt     *time.Time `json:"suspended_at,omitempty"`
	LastActiveAt    *time.Time `json:"last_active_at,omitempty"`
	Responsibility  *string    `json:"responsibility,omitempty"`
	Permissions     []string   `json:"permissions"`
	WalletAddr      *string    `json:"wallet_address"`
	IsBanned        bool       `json:"is_banned"`
	BanReason       *string    `json:"ban_reason,omitempty"`
}

type Upgrade struct {
	ID              int     `json:"id"`
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	Category        string  `json:"category"`
	BasePrice       float64 `json:"base_price"`
	PriceMultiplier float64 `json:"price_multiplier"`
	ProfitIncrease  float64 `json:"profit_increase"`
	ImageURL        string  `json:"image_url"`
}

type ShopItem struct {
	ID             int     `json:"id"`
	Title          string  `json:"title"`
	Description    string  `json:"description"`
	Category       string  `json:"category"`
	ProfitIncrease float64 `json:"profit_increase"`
	ImageURL       string  `json:"image_url"`
	CurrentLevel   int     `json:"current_level"`
	Price          float64 `json:"price"`
}

type UserUpgrade struct {
	UserID    int64 `json:"user_id"`
	UpgradeID int   `json:"upgrade_id"`
	Level     int   `json:"level"`
}

type Transaction struct {
	ID         int64     `json:"id"`
	SenderID   *int64    `json:"sender_id"`
	ReceiverID *int64    `json:"receiver_id"`
	SquadID    *int      `json:"squad_id"`
	Amount     float64   `json:"amount"`
	Type       string    `json:"type"`
	CreatedAt  time.Time `json:"created_at"`
}

type Quiz struct {
	ID         int       `json:"id"`
	Question   string    `json:"question"`
	Reward     int       `json:"reward"`
	ActiveDate time.Time `json:"active_date"`
	
	// Поля для фронтенда (ответ юзера из базы, если уже решал)
	HasAttempted bool `json:"has_attempted"`
	IsCorrect    bool `json:"is_correct,omitempty"`
}

type UserQuiz struct {
	UserID    int64     `json:"user_id"`
	QuizDate  time.Time `json:"quiz_date"`
	IsCorrect bool      `json:"is_correct"`
	CreatedAt time.Time `json:"created_at"`
}

type BetEvent struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	OptionAName    string    `json:"option_a_name"`
	OptionBName    string    `json:"option_b_name"`
	Status         string    `json:"status"`
	WinningOption  *string   `json:"winning_option"`
	CreatedAt      time.Time `json:"created_at"`
	
	// Aggregated fields for frontend
	PoolA          float64   `json:"pool_a"`
	PoolB          float64   `json:"pool_b"`
	UserBetOption  *string   `json:"user_bet_option,omitempty"`
	UserBetAmount  *float64  `json:"user_bet_amount,omitempty"`
}

type UserBet struct {
	ID            int       `json:"id"`
	UserID        int64     `json:"user_id"`
	EventID       int       `json:"event_id"`
	ChosenOption  string    `json:"chosen_option"`
	Amount        float64   `json:"amount"`
	CreatedAt     time.Time `json:"created_at"`
}

type Proposal struct {
	ID          int       `json:"id"`
	UserID      *int64    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	VotesUp     int       `json:"votes_up"`
	VotesDown   int       `json:"votes_down"`
	CreatedAt   time.Time `json:"created_at"`
	UserVote    string    `json:"user_vote,omitempty"` // "up" or "down" or ""
}

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	RewardCoins int    `json:"reward_coins"`
	LinkURL     string `json:"link_url"`
	IsCompleted bool   `json:"is_completed"`
}

type Skin struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Price     int    `json:"price"`
	ImageURL  string `json:"image_url"`
	IsOwned   bool   `json:"is_owned"`
	IsActive  bool   `json:"is_active"`
}

type CryptoTransaction struct {
	ID        int       `json:"id"`
	UserID    int64     `json:"user_id"`
	Type      string    `json:"type"`
	Amount    int64     `json:"amount"`
	TxHash    *string   `json:"tx_hash"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
