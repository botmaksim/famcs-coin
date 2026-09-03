package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"strings"
	"testing"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockUserRepoForAuth struct {
	mock.Mock
}

func (m *MockUserRepoForAuth) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) != nil {
		return args.Get(0).(*models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepoForAuth) CreateUser(ctx context.Context, user *models.User) error {
	return m.Called(ctx, user).Error(0)
}

func (m *MockUserRepoForAuth) UpdateSettings(ctx context.Context, id int64, customName *string, isHidden bool) error {
	return m.Called(ctx, id, customName, isHidden).Error(0)
}

func (m *MockUserRepoForAuth) UpdateRole(ctx context.Context, id int64, role string) error {
	return m.Called(ctx, id, role).Error(0)
}

func (m *MockUserRepoForAuth) GetLeaderboard(ctx context.Context, limit int, sortBy string, period string) ([]models.User, error) {
	args := m.Called(ctx, limit, sortBy, period)
	if args.Get(0) != nil {
		return args.Get(0).([]models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockUserRepoForAuth) UpdateBalance(ctx context.Context, tx pgx.Tx, userID int64, amount float64, txType string) error {
	return m.Called(ctx, tx, userID, amount, txType).Error(0)
}

func (m *MockUserRepoForAuth) ProcessClick(ctx context.Context, userID int64, coins float64, energyCost int) (float64, int, error) {
	args := m.Called(ctx, userID, coins, energyCost)
	return args.Get(0).(float64), args.Int(1), args.Error(2)
}

func (m *MockUserRepoForAuth) SearchUsers(ctx context.Context, query string, limit int) ([]models.User, error) {
	args := m.Called(ctx, query, limit)
	if args.Get(0) != nil {
		return args.Get(0).([]models.User), args.Error(1)
	}
	return nil, args.Error(1)
}

// generateValidInitData generates a cryptographically signed initData string using the botToken
func generateValidInitData(botToken string, userID int64, username, firstName, photoURL string) string {
	authDate := time.Now().Unix()
	userJSON := fmt.Sprintf(`{"id":%d,"first_name":%q,"username":%q,"photo_url":%q}`, userID, firstName, username, photoURL)

	values := url.Values{}
	values.Set("auth_date", fmt.Sprintf("%d", authDate))
	values.Set("query_id", "AAG_TEST_123")
	values.Set("user", userJSON)

	var keys []string
	for k := range values {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var dataCheckString []string
	for _, k := range keys {
		dataCheckString = append(dataCheckString, k+"="+values.Get(k))
	}
	checkStr := strings.Join(dataCheckString, "\n")

	secretMac := hmac.New(sha256.New, []byte("WebAppData"))
	secretMac.Write([]byte(botToken))
	secretKey := secretMac.Sum(nil)

	dataMac := hmac.New(sha256.New, secretKey)
	dataMac.Write([]byte(checkStr))
	hash := hex.EncodeToString(dataMac.Sum(nil))

	values.Set("hash", hash)
	return values.Encode()
}

func TestTMAAuthMiddleware_NewUserRegistration(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	mockRepo := new(MockUserRepoForAuth)
	newUserID := int64(987654321)

	// User does not exist initially in the database
	mockRepo.On("GetUserByID", mock.Anything, newUserID).Return(nil, nil).Once()

	// Middleware should auto-create the user
	mockRepo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *models.User) bool {
		return u.TgID == newUserID &&
			u.Username == "newbiesuper" &&
			u.FirstName == "New User" &&
			u.Role == "user" &&
			u.Balance == 0 &&
			u.Energy == 1000 &&
			u.MaxEnergy == 1000
	})).Return(nil).Once()

	initData := generateValidInitData(botToken, newUserID, "newbiesuper", "New User", "https://t.me/photo.jpg")

	calledNext := false
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calledNext = true
		tgID := r.Context().Value("tg_id").(int64)
		role := r.Context().Value("role").(string)
		assert.Equal(t, newUserID, tgID)
		assert.Equal(t, "user", role)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	handler := TMAAuthMiddleware(botToken, mockRepo)(nextHandler)

	req := httptest.NewRequest("GET", "/api/user/me", nil)
	req.Header.Set("Authorization", "tma "+initData)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.True(t, calledNext)
	mockRepo.AssertExpectations(t)
}

func TestTMAAuthMiddleware_ExistingUser_WithUpdates(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	mockRepo := new(MockUserRepoForAuth)
	existingUserID := int64(111222333)

	existingUser := &models.User{
		TgID:      existingUserID,
		Username:  "olduser",
		FirstName: "Old Name",
		Role:      "user",
		Balance:   500,
		Energy:    800,
		MaxEnergy: 1000,
	}

	mockRepo.On("GetUserByID", mock.Anything, existingUserID).Return(existingUser, nil).Once()
	mockRepo.On("CreateUser", mock.Anything, mock.MatchedBy(func(u *models.User) bool {
		return u.Username == "newuser" && u.FirstName == "New Name"
	})).Return(nil).Once()

	initData := generateValidInitData(botToken, existingUserID, "newuser", "New Name", "https://t.me/newpic.jpg")

	calledNext := false
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calledNext = true
		w.WriteHeader(http.StatusOK)
	})

	handler := TMAAuthMiddleware(botToken, mockRepo)(nextHandler)

	req := httptest.NewRequest("GET", "/api/user/me", nil)
	req.Header.Set("Authorization", "tma "+initData)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.True(t, calledNext)
	mockRepo.AssertExpectations(t)
}

func TestTMAAuthMiddleware_InvalidHash(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	mockRepo := new(MockUserRepoForAuth)

	handler := TMAAuthMiddleware(botToken, mockRepo)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	req := httptest.NewRequest("GET", "/api/user/me", nil)
	req.Header.Set("Authorization", "tma user=%7B%22id%22%3A123%7D&hash=invalidhash&auth_date=1700000000")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestWebAuthMiddleware(t *testing.T) {
	botToken := "test-secret-token"
	mockRepo := new(MockUserRepoForAuth)

	handler := WebAuthMiddleware(botToken, mockRepo)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: Missing auth header
	req1 := httptest.NewRequest("GET", "/api/data", nil)
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)
	assert.Equal(t, http.StatusUnauthorized, rec1.Code)

	// Case 2: Valid JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": float64(424242),
	})
	tokenStr, _ := token.SignedString([]byte(botToken))

	mockRepo.On("GetUserByID", mock.Anything, int64(424242)).Return(&models.User{
		TgID: 424242,
		Role: "admin",
	}, nil).Once()

	req2 := httptest.NewRequest("GET", "/api/data", nil)
	req2.Header.Set("Authorization", "Bearer "+tokenStr)
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)

	// Case 3: Valid JWT but user not in DB (fallback user)
	token2 := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": float64(999),
	})
	tokenStr2, _ := token2.SignedString([]byte(botToken))

	mockRepo.On("GetUserByID", mock.Anything, int64(999)).Return(nil, nil).Once()

	req3 := httptest.NewRequest("GET", "/api/data", nil)
	req3.Header.Set("Authorization", "Bearer "+tokenStr2)
	rec3 := httptest.NewRecorder()
	handler.ServeHTTP(rec3, req3)
	assert.Equal(t, http.StatusOK, rec3.Code)

	// Case 4: Invalid signature
	req4 := httptest.NewRequest("GET", "/api/data", nil)
	req4.Header.Set("Authorization", "Bearer invalid.jwt.token")
	rec4 := httptest.NewRecorder()
	handler.ServeHTTP(rec4, req4)
	assert.Equal(t, http.StatusUnauthorized, rec4.Code)
}

func TestOptionalAuthMiddleware(t *testing.T) {
	botToken := "test-token"
	handler := OptionalAuthMiddleware(botToken)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tgID := r.Context().Value("tg_id")
		if tgID != nil {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusNoContent)
		}
	}))

	// Case 1: No header
	req1 := httptest.NewRequest("GET", "/api/public", nil)
	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req1)
	assert.Equal(t, http.StatusNoContent, rec1.Code)

	// Case 2: Valid tma header
	initData := generateValidInitData(botToken, 777, "user777", "User", "")
	req2 := httptest.NewRequest("GET", "/api/public", nil)
	req2.Header.Set("Authorization", "tma "+initData)
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)
}

func TestCORSMiddleware(t *testing.T) {
	handler := CORSMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// Case 1: OPTIONS request
	reqOptions := httptest.NewRequest(http.MethodOptions, "/api/test", nil)
	recOptions := httptest.NewRecorder()
	handler.ServeHTTP(recOptions, reqOptions)
	assert.Equal(t, http.StatusOK, recOptions.Code)
	assert.Equal(t, "*", recOptions.Header().Get("Access-Control-Allow-Origin"))

	// Case 2: GET request
	reqGet := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	recGet := httptest.NewRecorder()
	handler.ServeHTTP(recGet, reqGet)
	assert.Equal(t, http.StatusOK, recGet.Code)
}

func TestRoleMiddleware(t *testing.T) {
	mockRepo := new(MockUserRepoForAuth)
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Case 1: No user_id in context
	req1 := httptest.NewRequest("GET", "/admin", nil)
	rec1 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "admin")(nextHandler).ServeHTTP(rec1, req1)
	assert.Equal(t, http.StatusUnauthorized, rec1.Code)

	// Case 2: User not found
	mockRepo.On("GetUserByID", mock.Anything, int64(10)).Return(nil, nil).Once()
	req2 := httptest.NewRequest("GET", "/admin", nil)
	ctx2 := context.WithValue(req2.Context(), UserIDKey, int64(10))
	rec2 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "admin")(nextHandler).ServeHTTP(rec2, req2.WithContext(ctx2))
	assert.Equal(t, http.StatusUnauthorized, rec2.Code)

	// Case 3: Insufficient role (user wants admin)
	mockRepo.On("GetUserByID", mock.Anything, int64(20)).Return(&models.User{TgID: 20, Role: "user"}, nil).Once()
	req3 := httptest.NewRequest("GET", "/admin", nil)
	ctx3 := context.WithValue(req3.Context(), UserIDKey, int64(20))
	rec3 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "admin")(nextHandler).ServeHTTP(rec3, req3.WithContext(ctx3))
	assert.Equal(t, http.StatusForbidden, rec3.Code)

	// Case 4: Admin allowed
	mockRepo.On("GetUserByID", mock.Anything, int64(30)).Return(&models.User{TgID: 30, Role: "admin"}, nil).Once()
	req4 := httptest.NewRequest("GET", "/admin", nil)
	ctx4 := context.WithValue(req4.Context(), UserIDKey, int64(30))
	rec4 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "admin")(nextHandler).ServeHTTP(rec4, req4.WithContext(ctx4))
	assert.Equal(t, http.StatusOK, rec4.Code)

	// Case 5: Superadmin allowed for superadmin
	mockRepo.On("GetUserByID", mock.Anything, int64(40)).Return(&models.User{TgID: 40, Role: "superadmin"}, nil).Once()
	req5 := httptest.NewRequest("GET", "/admin", nil)
	ctx5 := context.WithValue(req5.Context(), UserIDKey, int64(40))
	rec5 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "superadmin")(nextHandler).ServeHTTP(rec5, req5.WithContext(ctx5))
	assert.Equal(t, http.StatusOK, rec5.Code)

	// Case 6: Regular user role check
	mockRepo.On("GetUserByID", mock.Anything, int64(50)).Return(&models.User{TgID: 50, Role: "user"}, nil).Once()
	req6 := httptest.NewRequest("GET", "/user", nil)
	ctx6 := context.WithValue(req6.Context(), UserIDKey, int64(50))
	rec6 := httptest.NewRecorder()
	RoleMiddleware(mockRepo, "user")(nextHandler).ServeHTTP(rec6, req6.WithContext(ctx6))
	assert.Equal(t, http.StatusOK, rec6.Code)
}

func TestRequirePermission(t *testing.T) {
	mockRepo := new(MockUserRepoForAuth)
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Case 1: No user_id
	req1 := httptest.NewRequest("GET", "/perm", nil)
	rec1 := httptest.NewRecorder()
	RequirePermission(mockRepo, "manage_bets")(nextHandler).ServeHTTP(rec1, req1)
	assert.Equal(t, http.StatusUnauthorized, rec1.Code)

	// Case 2: Superadmin has all permissions
	mockRepo.On("GetUserByID", mock.Anything, int64(100)).Return(&models.User{TgID: 100, Role: "superadmin"}, nil).Once()
	req2 := httptest.NewRequest("GET", "/perm", nil)
	ctx2 := context.WithValue(req2.Context(), UserIDKey, int64(100))
	rec2 := httptest.NewRecorder()
	RequirePermission(mockRepo, "manage_bets")(nextHandler).ServeHTTP(rec2, req2.WithContext(ctx2))
	assert.Equal(t, http.StatusOK, rec2.Code)

	// Case 3: Admin has access
	mockRepo.On("GetUserByID", mock.Anything, int64(101)).Return(&models.User{TgID: 101, Role: "admin"}, nil).Once()
	req3 := httptest.NewRequest("GET", "/perm", nil)
	ctx3 := context.WithValue(req3.Context(), UserIDKey, int64(101))
	rec3 := httptest.NewRecorder()
	RequirePermission(mockRepo, "manage_bets")(nextHandler).ServeHTTP(rec3, req3.WithContext(ctx3))
	assert.Equal(t, http.StatusOK, rec3.Code)

	// Case 4: Regular user forbidden
	mockRepo.On("GetUserByID", mock.Anything, int64(102)).Return(&models.User{TgID: 102, Role: "user"}, nil).Once()
	req4 := httptest.NewRequest("GET", "/perm", nil)
	ctx4 := context.WithValue(req4.Context(), UserIDKey, int64(102))
	rec4 := httptest.NewRecorder()
	RequirePermission(mockRepo, "manage_bets")(nextHandler).ServeHTTP(rec4, req4.WithContext(ctx4))
	assert.Equal(t, http.StatusForbidden, rec4.Code)
}

func TestValidateInitData_EdgeCases(t *testing.T) {
	// 1. Missing hash
	ok, _, _, _, _ := validateInitData("user=%7B%7D&auth_date=123", "token")
	assert.False(t, ok)

	// 2. Missing auth_date
	ok, _, _, _, _ = validateInitData("hash=abc&user=%7B%7D", "token")
	assert.False(t, ok)

	// 3. Invalid auth_date format
	ok, _, _, _, _ = validateInitData("hash=abc&auth_date=invalid", "token")
	assert.False(t, ok)

	// 4. Expired auth_date
	pastDate := time.Now().Add(-48 * time.Hour).Unix()
	ok, _, _, _, _ = validateInitData(fmt.Sprintf("hash=abc&auth_date=%d", pastDate), "token")
	assert.False(t, ok)
}

