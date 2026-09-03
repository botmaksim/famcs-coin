package handlers

import (
	"context"
	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/mock"
)

type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) != nil {
		return args.Get(0).(*models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepository) CreateUser(ctx context.Context, user *models.User) error {
	return m.Called(ctx, user).Error(0)
}

func (m *MockUserRepository) UpdateSettings(ctx context.Context, id int64, customName *string, isHidden bool) error {
	return m.Called(ctx, id, customName, isHidden).Error(0)
}

func (m *MockUserRepository) UpdateRole(ctx context.Context, id int64, role string) error {
	return m.Called(ctx, id, role).Error(0)
}

func (m *MockUserRepository) GetLeaderboard(ctx context.Context, limit int, sortBy string, period string) ([]models.User, error) {
	args := m.Called(ctx, limit, sortBy)
	if args.Get(0) != nil {
		return args.Get(0).([]models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepository) UpdateBalance(ctx context.Context, tx pgx.Tx, userID int64, amount float64, txType string) error {
	return m.Called(ctx, tx, userID, amount, txType).Error(0)
}

func (m *MockUserRepository) ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) (float64, int, error) {
	args := m.Called(ctx, userID, coins, energyCost)
	return args.Get(0).(float64), args.Int(1), args.Error(2)
}

func (m *MockUserRepository) SearchUsers(ctx context.Context, query string, limit int) ([]models.User, error) {
	args := m.Called(ctx, query, limit)
	if args.Get(0) != nil {
		return args.Get(0).([]models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

type MockShopRepository struct {
	mock.Mock
}

func (m *MockShopRepository) GetItems(ctx context.Context, userID int64) ([]models.ShopItem, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) != nil {
		return args.Get(0).([]models.ShopItem), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockShopRepository) CreateItem(ctx context.Context, upgrade *models.Upgrade) error {
	return m.Called(ctx, upgrade).Error(0)
}

func (m *MockShopRepository) DeleteItem(ctx context.Context, upgradeID int) error {
	return m.Called(ctx, upgradeID).Error(0)
}

func (m *MockShopRepository) BuyItem(ctx context.Context, userID int64, upgradeID int) error {
	return m.Called(ctx, userID, upgradeID).Error(0)
}

func (m *MockShopRepository) SellItem(ctx context.Context, userID int64, upgradeID int) error {
	return m.Called(ctx, userID, upgradeID).Error(0)
}

type MockBetRepository struct {
	mock.Mock
}

func (m *MockBetRepository) GetBets(ctx context.Context, userID int64) ([]models.BetEvent, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) != nil {
		return args.Get(0).([]models.BetEvent), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockBetRepository) CreateBet(ctx context.Context, event *models.BetEvent) error {
	return m.Called(ctx, event).Error(0)
}

func (m *MockBetRepository) PlaceBet(ctx context.Context, userID int64, eventID int, optionIndex int, amount float64) error {
	return m.Called(ctx, userID, eventID, optionIndex, amount).Error(0)
}

func (m *MockBetRepository) CloseBet(ctx context.Context, eventID int, winningOption int) error {
	return m.Called(ctx, eventID, winningOption).Error(0)
}

type MockFeedbackRepository struct {
	mock.Mock
}

func (m *MockFeedbackRepository) GetFeedbacks(ctx context.Context) ([]models.Feedback, error) {
	args := m.Called(ctx)
	if args.Get(0) != nil {
		return args.Get(0).([]models.Feedback), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockFeedbackRepository) CreateFeedback(ctx context.Context, userID int64, text string) error {
	return m.Called(ctx, userID, text).Error(0)
}

func (m *MockFeedbackRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	return m.Called(ctx, id, status).Error(0)
}

func (m *MockFeedbackRepository) DeleteFeedback(ctx context.Context, id int) error {
	return m.Called(ctx, id).Error(0)
}

type MockNewsRepository struct {
	mock.Mock
}

func (m *MockNewsRepository) GetNews(ctx context.Context, voterID string) ([]models.NewsItem, error) {
	args := m.Called(ctx, voterID)
	if args.Get(0) != nil {
		return args.Get(0).([]models.NewsItem), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockNewsRepository) CreateNews(ctx context.Context, title, content string, imageURL *string, status string) (*models.NewsItem, error) {
	args := m.Called(ctx, title, content, imageURL, status)
	if args.Get(0) != nil {
		return args.Get(0).(*models.NewsItem), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockNewsRepository) UpdateNews(ctx context.Context, id int, title, content string, imageURL *string, status string, verdict, verdictNote *string) (*models.NewsItem, error) {
	args := m.Called(ctx, id, title, content, imageURL, status, verdict, verdictNote)
	if args.Get(0) != nil {
		return args.Get(0).(*models.NewsItem), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockNewsRepository) ClosePoll(ctx context.Context, id int, status string, verdict, verdictNote *string) (*models.NewsItem, error) {
	args := m.Called(ctx, id, status, verdict, verdictNote)
	if args.Get(0) != nil {
		return args.Get(0).(*models.NewsItem), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockNewsRepository) DeleteNews(ctx context.Context, id int) error {
	return m.Called(ctx, id).Error(0)
}

func (m *MockNewsRepository) VoteNews(ctx context.Context, newsID int, voterID, voteType string) (int, int, *string, error) {
	args := m.Called(ctx, newsID, voterID, voteType)
	var vote *string
	if args.Get(2) != nil {
		vote = args.Get(2).(*string)
	}
	return args.Int(0), args.Int(1), vote, args.Error(3)
}

func (m *MockNewsRepository) GetNewsHeader(ctx context.Context) (*models.NewsHeaderContent, error) {
	args := m.Called(ctx)
	if args.Get(0) != nil {
		return args.Get(0).(*models.NewsHeaderContent), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockNewsRepository) UpdateNewsHeader(ctx context.Context, title, subtitle, banner string) error {
	return m.Called(ctx, title, subtitle, banner).Error(0)
}
