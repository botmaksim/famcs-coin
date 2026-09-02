package repository

import (
	"context"
	"testing"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_GetUserByID(t *testing.T) {
	mock, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}
	defer mock.Close()

	repo := NewUserRepository(mock)
	ctx := context.Background()

	t.Run("user found", func(t *testing.T) {
		id := int64(123)
		now := time.Now()
		avatarURL := "url"
		
		rows := mock.NewRows([]string{"tg_id", "username", "first_name", "custom_name", "avatar_url", "role", "balance", "energy", "max_energy", "passive_income", "is_hidden", "last_active_at", "created_at"}).
			AddRow(id, "testuser", "Test", nil, &avatarURL, "user", 100.0, 50, 100, 1.5, false, &now, now)

		mock.ExpectQuery("^SELECT tg_id, username, COALESCE\\(first_name, ''\\), custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, last_active_at, created_at FROM users WHERE tg_id = \\$1$").
			WithArgs(id).
			WillReturnRows(rows)

		user, err := repo.GetUserByID(ctx, id)
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, id, user.TgID)
		assert.Equal(t, "testuser", user.Username)
	})

	t.Run("user not found", func(t *testing.T) {
		id := int64(999)
		mock.ExpectQuery("^SELECT tg_id, username, COALESCE\\(first_name, ''\\), custom_name, avatar_url, role, balance, energy, max_energy, passive_income, is_hidden, last_active_at, created_at FROM users WHERE tg_id = \\$1$").
			WithArgs(id).
			WillReturnError(pgx.ErrNoRows)

		user, err := repo.GetUserByID(ctx, id)
		assert.NoError(t, err) // Our implementation returns nil, nil for ErrNoRows
		assert.Nil(t, user)
	})
}

func TestUserRepository_CreateUser(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)
	avatarURL := "url"
	user := &models.User{
		TgID:      123,
		Username:  "newuser",
		FirstName: "New User",
		AvatarURL: &avatarURL,
		Role:      "user",
		Balance:   0,
		Energy:    100,
		MaxEnergy: 100,
	}

	mock.ExpectExec("^INSERT INTO users").
		WithArgs(user.TgID, user.Username, user.FirstName, user.AvatarURL, user.Role, user.Balance, user.Energy, user.MaxEnergy).
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.CreateUser(context.Background(), user)
	assert.NoError(t, err)
}

func TestUserRepository_UpdateSettings(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)
	
	customName := "Custom"
	mock.ExpectExec("^UPDATE users SET custom_name = \\$1, is_hidden = \\$2 WHERE tg_id = \\$3$").
		WithArgs(&customName, true, int64(123)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err = repo.UpdateSettings(context.Background(), 123, &customName, true)
	assert.NoError(t, err)
}

func TestUserRepository_UpdateRole(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewUserRepository(mock)
	
	mock.ExpectExec("^UPDATE users SET role = \\$1 WHERE tg_id = \\$2$").
		WithArgs("admin", int64(123)).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	err = repo.UpdateRole(context.Background(), 123, "admin")
	assert.NoError(t, err)
}
