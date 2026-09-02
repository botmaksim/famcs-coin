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
	CreateNews(ctx context.Context, title, content string, imageURL *string) (*models.NewsItem, error)
	UpdateNews(ctx context.Context, id int, title, content string, imageURL *string) (*models.NewsItem, error)
	DeleteNews(ctx context.Context, id int) error
	VoteNews(ctx context.Context, newsID int, voterID, voteType string) (likes int, dislikes int, userVote *string, err error)
}

type newsRepository struct {
	db db.PgxPoolIface
}

func NewNewsRepository(db db.PgxPoolIface) NewsRepository {
	return &newsRepository{db: db}
}

func (r *newsRepository) GetNews(ctx context.Context, voterID string) ([]models.NewsItem, error) {
	query := `
		SELECT n.id, n.title, n.content, n.image_url, n.likes_count, n.dislikes_count, n.created_at,
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

func (r *newsRepository) CreateNews(ctx context.Context, title, content string, imageURL *string) (*models.NewsItem, error) {
	query := `
		INSERT INTO news (title, content, image_url)
		VALUES ($1, $2, $3)
		RETURNING id, title, content, image_url, likes_count, dislikes_count, created_at
	`
	var item models.NewsItem
	err := r.db.QueryRow(ctx, query, title, content, imageURL).Scan(
		&item.ID,
		&item.Title,
		&item.Content,
		&item.ImageURL,
		&item.LikesCount,
		&item.DislikesCount,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *newsRepository) UpdateNews(ctx context.Context, id int, title, content string, imageURL *string) (*models.NewsItem, error) {
	query := `
		UPDATE news
		SET title = $1, content = $2, image_url = $3
		WHERE id = $4
		RETURNING id, title, content, image_url, likes_count, dislikes_count, created_at
	`
	var item models.NewsItem
	err := r.db.QueryRow(ctx, query, title, content, imageURL, id).Scan(
		&item.ID,
		&item.Title,
		&item.Content,
		&item.ImageURL,
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
