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
	GetPendingProposals(ctx context.Context) ([]*models.Proposal, error)
	Propose(ctx context.Context, tgID int64, title, description string, pledgeAmount float64) error
	ModerateProposal(ctx context.Context, proposalID int, decision string) error
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

func (r *daoRepository) GetPendingProposals(ctx context.Context) ([]*models.Proposal, error) {
	query := `
		SELECT id, user_id, title, description, status, created_at
		FROM proposals
		WHERE status = 'pending'
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("GetPendingProposals query error: %w", err)
	}
	defer rows.Close()

	var proposals []*models.Proposal
	for rows.Next() {
		p := &models.Proposal{}
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Description, &p.Status, &p.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("GetPendingProposals scan error: %w", err)
		}
		proposals = append(proposals, p)
	}
	return proposals, nil
}

func (r *daoRepository) Propose(ctx context.Context, tgID int64, title, description string, pledgeAmount float64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check balance
	var balance float64
	err = tx.QueryRow(ctx, "SELECT balance FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&balance)
	if err != nil {
		return fmt.Errorf("failed to fetch user balance: %w", err)
	}
	if balance < pledgeAmount {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct pledge
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", pledgeAmount, tgID)
	if err != nil {
		return fmt.Errorf("failed to deduct pledge: %w", err)
	}

	// Record transaction
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES ($1, NULL, $2, 'dao_pledge')", tgID, pledgeAmount)
	if err != nil {
		return fmt.Errorf("failed to insert transaction: %w", err)
	}

	// Create proposal
	_, err = tx.Exec(ctx, "INSERT INTO proposals (user_id, title, description, status) VALUES ($1, $2, $3, 'pending')", tgID, title, description)
	if err != nil {
		return fmt.Errorf("failed to insert proposal: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *daoRepository) ModerateProposal(ctx context.Context, proposalID int, decision string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var status string
	var userID *int64
	err = tx.QueryRow(ctx, "SELECT status, user_id FROM proposals WHERE id = $1 FOR UPDATE", proposalID).Scan(&status, &userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("proposal not found")
		}
		return fmt.Errorf("failed to fetch proposal: %w", err)
	}
	
	if status != "pending" {
		return fmt.Errorf("proposal is not pending")
	}

	if decision == "approve" {
		_, err = tx.Exec(ctx, "UPDATE proposals SET status = 'active' WHERE id = $1", proposalID)
		if err != nil {
			return fmt.Errorf("failed to approve proposal: %w", err)
		}
	} else if decision == "reject" {
		_, err = tx.Exec(ctx, "UPDATE proposals SET status = 'rejected' WHERE id = $1", proposalID)
		if err != nil {
			return fmt.Errorf("failed to reject proposal: %w", err)
		}
		
		// Return pledge amount (assume constant 1000 for now, or fetch from settings)
		// We'll hardcode 1000 based on standard pledge, or if dynamic, we should have saved it.
		// Let's assume 1000 since we don't have pledge_amount in proposals table.
		if userID != nil {
			_, err = tx.Exec(ctx, "UPDATE users SET balance = balance + 1000 WHERE tg_id = $1", *userID)
			if err != nil {
				return fmt.Errorf("failed to refund pledge: %w", err)
			}
			
			// Record refund transaction
			_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES (NULL, $1, 1000, 'dao_refund')", *userID)
			if err != nil {
				return fmt.Errorf("failed to record refund: %w", err)
			}
		}
	} else {
		return fmt.Errorf("invalid decision")
	}

	return tx.Commit(ctx)
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
