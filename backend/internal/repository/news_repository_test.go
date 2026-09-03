package repository

import (
	"context"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/pashagolub/pgxmock/v4"
	"github.com/stretchr/testify/assert"
)

func TestNewsRepository_GetNews(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)
	now := time.Now()
	voteType := "like"

	rows := mock.NewRows([]string{
		"id", "title", "content", "image_url", "status", "verdict", "verdict_note",
		"likes_count", "dislikes_count", "created_at", "vote_type",
	}).AddRow(1, "Новость 1", "Текст новости", nil, "open", nil, nil, 10, 2, now, &voteType)

	mock.ExpectQuery("^SELECT n.id, n.title, n.content, n.image_url, COALESCE").
		WithArgs("voter_1").
		WillReturnRows(rows)

	items, err := repo.GetNews(context.Background(), "voter_1")
	assert.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "Новость 1", items[0].Title)
	assert.Equal(t, "open", items[0].Status)
	assert.Equal(t, &voteType, items[0].UserVote)
}

func TestNewsRepository_CreateNews(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)
	now := time.Now()

	rows := mock.NewRows([]string{
		"id", "title", "content", "image_url", "status", "verdict", "verdict_note",
		"likes_count", "dislikes_count", "created_at",
	}).AddRow(1, "Новая", "Описание", nil, "open", nil, nil, 0, 0, now)

	mock.ExpectQuery("^INSERT INTO news").
		WithArgs("Новая", "Описание", (*string)(nil), "open").
		WillReturnRows(rows)

	item, err := repo.CreateNews(context.Background(), "Новая", "Описание", nil, "open")
	assert.NoError(t, err)
	assert.NotNil(t, item)
	assert.Equal(t, 1, item.ID)

	// Error case
	mock.ExpectQuery("^INSERT INTO news").
		WithArgs("Err", "Err", (*string)(nil), "open").
		WillReturnError(assert.AnError)
	_, err2 := repo.CreateNews(context.Background(), "Err", "Err", nil, "")
	assert.Error(t, err2)
}

func TestNewsRepository_UpdateNews(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)
	now := time.Now()
	verdict := "Принято"

	rows := mock.NewRows([]string{
		"id", "title", "content", "image_url", "status", "verdict", "verdict_note",
		"likes_count", "dislikes_count", "created_at",
	}).AddRow(1, "Обновлено", "Новый текст", nil, "in_progress", &verdict, nil, 5, 1, now)

	mock.ExpectQuery("^UPDATE news").
		WithArgs("Обновлено", "Новый текст", (*string)(nil), "in_progress", &verdict, (*string)(nil), 1).
		WillReturnRows(rows)

	item, err := repo.UpdateNews(context.Background(), 1, "Обновлено", "Новый текст", nil, "in_progress", &verdict, nil)
	assert.NoError(t, err)
	assert.NotNil(t, item)
	assert.Equal(t, "in_progress", item.Status)

	// Error case
	mock.ExpectQuery("^UPDATE news").
		WithArgs("Err", "Err", (*string)(nil), "open", (*string)(nil), (*string)(nil), 2).
		WillReturnError(assert.AnError)
	_, err2 := repo.UpdateNews(context.Background(), 2, "Err", "Err", nil, "", nil, nil)
	assert.Error(t, err2)
}

func TestNewsRepository_ClosePoll(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)
	now := time.Now()
	verdict := "Реализовано"
	note := "В версии 1.2"

	rows := mock.NewRows([]string{
		"id", "title", "content", "image_url", "status", "verdict", "verdict_note",
		"likes_count", "dislikes_count", "created_at",
	}).AddRow(1, "Опрос", "Текст", nil, "implemented", &verdict, &note, 15, 2, now)

	mock.ExpectQuery("^UPDATE news").
		WithArgs("implemented", &verdict, &note, 1).
		WillReturnRows(rows)

	item, err := repo.ClosePoll(context.Background(), 1, "implemented", &verdict, &note)
	assert.NoError(t, err)
	assert.NotNil(t, item)
	assert.Equal(t, "implemented", item.Status)
	assert.Equal(t, &verdict, item.Verdict)

	// Error case
	mock.ExpectQuery("^UPDATE news").
		WithArgs("closed", (*string)(nil), (*string)(nil), 2).
		WillReturnError(assert.AnError)
	_, err2 := repo.ClosePoll(context.Background(), 2, "", nil, nil)
	assert.Error(t, err2)
}

func TestNewsRepository_DeleteNews(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	mock.ExpectExec("^DELETE FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	err = repo.DeleteNews(context.Background(), 1)
	assert.NoError(t, err)
}

func TestNewsRepository_VoteNews_Success(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	mock.ExpectBegin()
	// Check status
	mock.ExpectQuery("^SELECT COALESCE\\(status, 'open'\\) FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"status"}).AddRow("open"))

	// Check existing vote (no rows)
	mock.ExpectQuery("^SELECT vote_type FROM news_votes").
		WithArgs(1, "voter_1").
		WillReturnError(pgx.ErrNoRows)

	// Insert vote
	mock.ExpectExec("^INSERT INTO news_votes").
		WithArgs(1, "voter_1", "like").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	// Update like count
	mock.ExpectExec("^UPDATE news SET likes_count = likes_count \\+ 1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// Return updated counts
	mock.ExpectQuery("^SELECT likes_count, dislikes_count FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"likes_count", "dislikes_count"}).AddRow(1, 0))

	mock.ExpectCommit()

	likes, dislikes, userVote, err := repo.VoteNews(context.Background(), 1, "voter_1", "like")
	assert.NoError(t, err)
	assert.Equal(t, 1, likes)
	assert.Equal(t, 0, dislikes)
	assert.NotNil(t, userVote)
	assert.Equal(t, "like", *userVote)
}

func TestNewsRepository_VoteNews_ToggleUnvote(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	mock.ExpectBegin()
	mock.ExpectQuery("^SELECT COALESCE\\(status, 'open'\\) FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"status"}).AddRow("open"))

	// Existing vote is "like"
	mock.ExpectQuery("^SELECT vote_type FROM news_votes").
		WithArgs(1, "voter_1").
		WillReturnRows(mock.NewRows([]string{"vote_type"}).AddRow("like"))

	// Delete vote
	mock.ExpectExec("^DELETE FROM news_votes").
		WithArgs(1, "voter_1").
		WillReturnResult(pgxmock.NewResult("DELETE", 1))

	// Decrement like count
	mock.ExpectExec("^UPDATE news SET likes_count = GREATEST").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// Return updated counts
	mock.ExpectQuery("^SELECT likes_count, dislikes_count FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"likes_count", "dislikes_count"}).AddRow(0, 0))

	mock.ExpectCommit()

	likes, dislikes, userVote, err := repo.VoteNews(context.Background(), 1, "voter_1", "like")
	assert.NoError(t, err)
	assert.Equal(t, 0, likes)
	assert.Equal(t, 0, dislikes)
	assert.Nil(t, userVote)
}

func TestNewsRepository_VoteNews_SwitchVote(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	mock.ExpectBegin()
	mock.ExpectQuery("^SELECT COALESCE\\(status, 'open'\\) FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"status"}).AddRow("open"))

	// Existing vote was "like", switching to "dislike"
	mock.ExpectQuery("^SELECT vote_type FROM news_votes").
		WithArgs(1, "voter_1").
		WillReturnRows(mock.NewRows([]string{"vote_type"}).AddRow("like"))

	// Update vote to dislike
	mock.ExpectExec("^UPDATE news_votes SET vote_type = \\$3").
		WithArgs(1, "voter_1", "dislike").
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	// Update counts
	mock.ExpectExec("^UPDATE news SET dislikes_count = dislikes_count \\+ 1").
		WithArgs(1).
		WillReturnResult(pgxmock.NewResult("UPDATE", 1))

	mock.ExpectQuery("^SELECT likes_count, dislikes_count FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"likes_count", "dislikes_count"}).AddRow(0, 1))

	mock.ExpectCommit()

	likes, dislikes, userVote, err := repo.VoteNews(context.Background(), 1, "voter_1", "dislike")
	assert.NoError(t, err)
	assert.Equal(t, 0, likes)
	assert.Equal(t, 1, dislikes)
	assert.NotNil(t, userVote)
	assert.Equal(t, "dislike", *userVote)
}

func TestNewsRepository_VoteNews_ClosedPoll(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	mock.ExpectBegin()
	// Status is closed
	mock.ExpectQuery("^SELECT COALESCE\\(status, 'open'\\) FROM news WHERE id = \\$1$").
		WithArgs(1).
		WillReturnRows(mock.NewRows([]string{"status"}).AddRow("closed"))

	mock.ExpectRollback()

	_, _, _, err = repo.VoteNews(context.Background(), 1, "voter_1", "like")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "голосование по этой теме уже завершено")
}

func TestNewsRepository_Header(t *testing.T) {
	mock, err := pgxmock.NewPool()
	assert.NoError(t, err)
	defer mock.Close()

	repo := NewNewsRepository(mock)

	// GetNewsHeader
	rows := mock.NewRows([]string{"key", "value"}).
		AddRow("news_header_title", "Планы FAMCS").
		AddRow("news_header_subtitle", "Описания фич").
		AddRow("news_banner_markdown", "Важный баннер")

	mock.ExpectQuery("^SELECT key, value FROM site_content").
		WillReturnRows(rows)

	header, err := repo.GetNewsHeader(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, "Планы FAMCS", header.Title)
	assert.Equal(t, "Описания фич", header.Subtitle)
	assert.Equal(t, "Важный баннер", header.Banner)

	// UpdateNewsHeader
	mock.ExpectExec("^INSERT INTO site_content").
		WithArgs("news_header_title", "Upd Title").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectExec("^INSERT INTO site_content").
		WithArgs("news_header_subtitle", "Upd Sub").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	mock.ExpectExec("^INSERT INTO site_content").
		WithArgs("news_banner_markdown", "Upd Banner").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = repo.UpdateNewsHeader(context.Background(), "Upd Title", "Upd Sub", "Upd Banner")
	assert.NoError(t, err)
}
