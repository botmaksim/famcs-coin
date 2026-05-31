package repository

import (
	"context"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DaoRepository interface {
	GetActiveProposals(ctx context.Context, tgID int64) ([]*models.Proposal, error)
	Vote(ctx context.Context, tgID int64, proposalID int, voteType string) error
}

type daoRepository struct {
	pool *pgxpool.Pool
}

func NewDaoRepository(pool *pgxpool.Pool) DaoRepository {
	return &daoRepository{pool: pool}
}

func (r *daoRepository) GetActiveProposals(ctx context.Context, tgID int64) ([]*models.Proposal, error) {
	query := `
		SELECT 
			p.id, p.title, p.description, p.status, p.votes_up, p.votes_down, p.created_at,
			COALESCE(uv.vote_type, '') as user_vote
		FROM proposals p
		LEFT JOIN user_votes uv ON p.id = uv.proposal_id AND uv.user_id = $1
		WHERE p.status = 'active'
		ORDER BY p.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("GetActiveProposals query error: %w", err)
	}
	defer rows.Close()

	var proposals []*models.Proposal
	for rows.Next() {
		p := &models.Proposal{}
		err := rows.Scan(
			&p.ID, &p.Title, &p.Description, &p.Status, &p.VotesUp, &p.VotesDown, &p.CreatedAt, &p.UserVote,
		)
		if err != nil {
			return nil, fmt.Errorf("GetActiveProposals scan error: %w", err)
		}
		proposals = append(proposals, p)
	}
	return proposals, nil
}

func (r *daoRepository) Vote(ctx context.Context, tgID int64, proposalID int, voteType string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check if user already voted (and lock the row if it exists, though we mostly just insert)
	var existingVote string
	err = tx.QueryRow(ctx, "SELECT vote_type FROM user_votes WHERE user_id = $1 AND proposal_id = $2 FOR UPDATE", tgID, proposalID).Scan(&existingVote)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("failed to check existing vote: %w", err)
	}
	if err == nil {
		return fmt.Errorf("already voted")
	}

	// Lock the proposal to prevent race conditions during vote count update
	var currentStatus string
	err = tx.QueryRow(ctx, "SELECT status FROM proposals WHERE id = $1 FOR UPDATE", proposalID).Scan(&currentStatus)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("proposal not found")
		}
		return fmt.Errorf("failed to lock proposal: %w", err)
	}
	if currentStatus != "active" {
		return fmt.Errorf("proposal is not active")
	}

	// Insert the vote
	_, err = tx.Exec(ctx, "INSERT INTO user_votes (user_id, proposal_id, vote_type) VALUES ($1, $2, $3)", tgID, proposalID, voteType)
	if err != nil {
		return fmt.Errorf("failed to insert vote: %w", err)
	}

	// Update the vote count on the proposal
	updateQuery := ""
	if voteType == "up" {
		updateQuery = "UPDATE proposals SET votes_up = votes_up + 1 WHERE id = $1"
	} else if voteType == "down" {
		updateQuery = "UPDATE proposals SET votes_down = votes_down + 1 WHERE id = $1"
	} else {
		return fmt.Errorf("invalid vote type")
	}

	_, err = tx.Exec(ctx, updateQuery, proposalID)
	if err != nil {
		return fmt.Errorf("failed to update proposal vote count: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("tx commit failed: %w", err)
	}

	return nil
}
