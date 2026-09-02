package repository

import (
	"context"
	"errors"

	"famcscoin-backend/internal/db"
	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
)

type NewsRepository interface {
	GetNews(ctx context.Context, voterID string) ([]models.NewsItem, error)
	CreateNews(ctx context.Context, title, content string, imageURL *string, status string) (*models.NewsItem, error)
	UpdateNews(ctx context.Context, id int, title, content string, imageURL *string, status string, verdict, verdictNote *string) (*models.NewsItem, error)
	ClosePoll(ctx context.Context, id int, status string, verdict, verdictNote *string) (*models.NewsItem, error)
	DeleteNews(ctx context.Context, id int) error
	VoteNews(ctx context.Context, newsID int, voterID, voteType string) (likes int, dislikes int, userVote *string, err error)
	GetNewsHeader(ctx context.Context) (*models.NewsHeaderContent, error)
	UpdateNewsHeader(ctx context.Context, title, subtitle, banner string) error
}

type newsRepository struct {
	db db.PgxPoolIface
}

func NewNewsRepository(db db.PgxPoolIface) NewsRepository {
	return &newsRepository{db: db}
}

func (r *newsRepository) GetNews(ctx context.Context, voterID string) ([]models.NewsItem, error) {
	query := `
		SELECT n.id, n.title, n.content, n.image_url, COALESCE(n.status, 'open'), n.verdict, n.verdict_note,
		       n.likes_count, n.dislikes_count, n.created_at,
		       v.vote_type
		FROM news n
		LEFT JOIN news_votes v ON n.id = v.news_id AND v.voter_id = $1
		ORDER BY n.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, voterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.NewsItem{}
	for rows.Next() {
		var item models.NewsItem
		var userVote *string
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Content,
			&item.ImageURL,
			&item.Status,
			&item.Verdict,
			&item.VerdictNote,
			&item.LikesCount,
			&item.DislikesCount,
			&item.CreatedAt,
			&userVote,
		); err != nil {
			return nil, err
		}
		item.UserVote = userVote
		items = append(items, item)
	}
	return items, nil
}

func (r *newsRepository) CreateNews(ctx context.Context, title, content string, imageURL *string, status string) (*models.NewsItem, error) {
	if status == "" {
		status = "open"
	}
	query := `
		INSERT INTO news (title, content, image_url, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, content, image_url, status, verdict, verdict_note, likes_count, dislikes_count, created_at
	`
	var item models.NewsItem
	err := r.db.QueryRow(ctx, query, title, content, imageURL, status).Scan(
		&item.ID,
		&item.Title,
		&item.Content,
		&item.ImageURL,
		&item.Status,
		&item.Verdict,
		&item.VerdictNote,
		&item.LikesCount,
		&item.DislikesCount,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *newsRepository) UpdateNews(ctx context.Context, id int, title, content string, imageURL *string, status string, verdict, verdictNote *string) (*models.NewsItem, error) {
	if status == "" {
		status = "open"
	}
	query := `
		UPDATE news
		SET title = $1, content = $2, image_url = $3, status = $4, verdict = $5, verdict_note = $6
		WHERE id = $7
		RETURNING id, title, content, image_url, status, verdict, verdict_note, likes_count, dislikes_count, created_at
	`
	var item models.NewsItem
	err := r.db.QueryRow(ctx, query, title, content, imageURL, status, verdict, verdictNote, id).Scan(
		&item.ID,
		&item.Title,
		&item.Content,
		&item.ImageURL,
		&item.Status,
		&item.Verdict,
		&item.VerdictNote,
		&item.LikesCount,
		&item.DislikesCount,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *newsRepository) ClosePoll(ctx context.Context, id int, status string, verdict, verdictNote *string) (*models.NewsItem, error) {
	if status == "" {
		status = "closed"
	}
	query := `
		UPDATE news
		SET status = $1, verdict = $2, verdict_note = $3
		WHERE id = $4
		RETURNING id, title, content, image_url, status, verdict, verdict_note, likes_count, dislikes_count, created_at
	`
	var item models.NewsItem
	err := r.db.QueryRow(ctx, query, status, verdict, verdictNote, id).Scan(
		&item.ID,
		&item.Title,
		&item.Content,
		&item.ImageURL,
		&item.Status,
		&item.Verdict,
		&item.VerdictNote,
		&item.LikesCount,
		&item.DislikesCount,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *newsRepository) DeleteNews(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM news WHERE id = $1`, id)
	return err
}

func (r *newsRepository) VoteNews(ctx context.Context, newsID int, voterID, voteType string) (int, int, *string, error) {
	if voteType != "like" && voteType != "dislike" {
		return 0, 0, nil, errors.New("invalid vote type")
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, 0, nil, err
	}
	defer tx.Rollback(ctx)

	// Check if poll is active
	var status string
	err = tx.QueryRow(ctx, `SELECT COALESCE(status, 'open') FROM news WHERE id = $1`, newsID).Scan(&status)
	if err != nil {
		return 0, 0, nil, errors.New("новость не найдена")
	}
	if status != "open" {
		return 0, 0, nil, errors.New("голосование по этой теме уже завершено")
	}

	var existingVote string
	err = tx.QueryRow(ctx, `SELECT vote_type FROM news_votes WHERE news_id = $1 AND voter_id = $2`, newsID, voterID).Scan(&existingVote)

	var finalUserVote *string

	if errors.Is(err, pgx.ErrNoRows) {
		// New vote
		_, err = tx.Exec(ctx, `INSERT INTO news_votes (news_id, voter_id, vote_type) VALUES ($1, $2, $3)`, newsID, voterID, voteType)
		if err != nil {
			return 0, 0, nil, err
		}
		if voteType == "like" {
			_, err = tx.Exec(ctx, `UPDATE news SET likes_count = likes_count + 1 WHERE id = $1`, newsID)
		} else {
			_, err = tx.Exec(ctx, `UPDATE news SET dislikes_count = dislikes_count + 1 WHERE id = $1`, newsID)
		}
		if err != nil {
			return 0, 0, nil, err
		}
		finalUserVote = &voteType
	} else if err == nil {
		if existingVote == voteType {
			// Toggle off (unvote)
			_, err = tx.Exec(ctx, `DELETE FROM news_votes WHERE news_id = $1 AND voter_id = $2`, newsID, voterID)
			if err != nil {
				return 0, 0, nil, err
			}
			if voteType == "like" {
				_, err = tx.Exec(ctx, `UPDATE news SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, newsID)
			} else {
				_, err = tx.Exec(ctx, `UPDATE news SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = $1`, newsID)
			}
			if err != nil {
				return 0, 0, nil, err
			}
			finalUserVote = nil
		} else {
			// Switch vote
			_, err = tx.Exec(ctx, `UPDATE news_votes SET vote_type = $3 WHERE news_id = $1 AND voter_id = $2`, newsID, voterID, voteType)
			if err != nil {
				return 0, 0, nil, err
			}
			if voteType == "like" {
				_, err = tx.Exec(ctx, `UPDATE news SET likes_count = likes_count + 1, dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = $1`, newsID)
			} else {
				_, err = tx.Exec(ctx, `UPDATE news SET dislikes_count = dislikes_count + 1, likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`, newsID)
			}
			if err != nil {
				return 0, 0, nil, err
			}
			finalUserVote = &voteType
		}
	} else {
		return 0, 0, nil, err
	}

	var likes, dislikes int
	err = tx.QueryRow(ctx, `SELECT likes_count, dislikes_count FROM news WHERE id = $1`, newsID).Scan(&likes, &dislikes)
	if err != nil {
		return 0, 0, nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, 0, nil, err
	}

	return likes, dislikes, finalUserVote, nil
}

func (r *newsRepository) GetNewsHeader(ctx context.Context) (*models.NewsHeaderContent, error) {
	header := &models.NewsHeaderContent{
		Title:    "Новости и Идеи Развития",
		Subtitle: "Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!",
		Banner:   "",
	}

	rows, err := r.db.Query(ctx, `SELECT key, value FROM site_content WHERE key IN ('news_header_title', 'news_header_subtitle', 'news_banner_markdown')`)
	if err != nil {
		return header, nil // fallback to defaults on error
	}
	defer rows.Close()

	for rows.Next() {
		var key, val string
		if err := rows.Scan(&key, &val); err == nil {
			switch key {
			case "news_header_title":
				if val != "" {
					header.Title = val
				}
			case "news_header_subtitle":
				header.Subtitle = val
			case "news_banner_markdown":
				header.Banner = val
			}
		}
	}
	return header, nil
}

func (r *newsRepository) UpdateNewsHeader(ctx context.Context, title, subtitle, banner string) error {
	queries := []struct {
		key, val string
	}{
		{"news_header_title", title},
		{"news_header_subtitle", subtitle},
		{"news_banner_markdown", banner},
	}

	for _, q := range queries {
		_, err := r.db.Exec(ctx, `
			INSERT INTO site_content (key, value, updated_at)
			VALUES ($1, $2, CURRENT_TIMESTAMP)
			ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
		`, q.key, q.val)
		if err != nil {
			return err
		}
	}
	return nil
}
