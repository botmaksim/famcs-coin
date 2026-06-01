package repository

import (
	"context"
	"errors"
	"fmt"

	"famcscoin-backend/internal/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNoWallet = errors.New("Кошелек не привязан")
var ErrDuplicateTx = errors.New("Эта транзакция уже отправлена на проверку")

type CryptoRepository interface {
	UpdateWalletAddress(ctx context.Context, tgID int64, walletAddress string) error
	Withdraw(ctx context.Context, tgID int64, amount int64) error
	SubmitDepositTx(ctx context.Context, tgID int64, txHash string) error
	GetCryptoHistory(ctx context.Context, tgID int64) ([]*models.CryptoTransaction, error)
}

type cryptoRepository struct {
	pool *pgxpool.Pool
}

func NewCryptoRepository(pool *pgxpool.Pool) CryptoRepository {
	return &cryptoRepository{pool: pool}
}

func (r *cryptoRepository) UpdateWalletAddress(ctx context.Context, tgID int64, walletAddress string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET wallet_address = $1 WHERE tg_id = $2", walletAddress, tgID)
	if err != nil {
		return fmt.Errorf("failed to update wallet address: %w", err)
	}
	return nil
}

func (r *cryptoRepository) Withdraw(ctx context.Context, tgID int64, amount int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var balance float64
	var walletAddr *string
	err = tx.QueryRow(ctx, "SELECT balance, wallet_address FROM users WHERE tg_id = $1 FOR UPDATE", tgID).Scan(&balance, &walletAddr)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to fetch user data: %w", err)
	}

	if walletAddr == nil || *walletAddr == "" {
		return ErrNoWallet
	}

	if balance < float64(amount) {
		return fmt.Errorf("insufficient balance")
	}

	// Deduct balance
	_, err = tx.Exec(ctx, "UPDATE users SET balance = balance - $1 WHERE tg_id = $2", float64(amount), tgID)
	if err != nil {
		return fmt.Errorf("failed to deduct balance: %w", err)
	}

	// Record the crypto transaction
	_, err = tx.Exec(ctx, "INSERT INTO crypto_transactions (user_id, type, amount, status) VALUES ($1, 'withdraw', $2, 'pending')", tgID, amount)
	if err != nil {
		return fmt.Errorf("failed to insert crypto transaction: %w", err)
	}

	// Also record in regular transactions
	_, err = tx.Exec(ctx, "INSERT INTO transactions (sender_id, receiver_id, amount, type) VALUES ($1, NULL, $2, 'withdraw')", tgID, float64(amount))
	if err != nil {
		return fmt.Errorf("failed to insert general transaction: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *cryptoRepository) GetCryptoHistory(ctx context.Context, tgID int64) ([]*models.CryptoTransaction, error) {
	query := `
		SELECT id, user_id, type, amount, tx_hash, status, created_at
		FROM crypto_transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, tgID)
	if err != nil {
		return nil, fmt.Errorf("failed to query crypto history: %w", err)
	}
	defer rows.Close()

	var txs []*models.CryptoTransaction
	for rows.Next() {
		tx := &models.CryptoTransaction{}
		err := rows.Scan(&tx.ID, &tx.UserID, &tx.Type, &tx.Amount, &tx.TxHash, &tx.Status, &tx.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan crypto tx: %w", err)
		}
		txs = append(txs, tx)
	}
	return txs, nil
}

func (r *cryptoRepository) SubmitDepositTx(ctx context.Context, tgID int64, txHash string) error {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM crypto_transactions WHERE tx_hash = $1", txHash).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check existing tx: %w", err)
	}
	if count > 0 {
		return ErrDuplicateTx
	}

	_, err = r.pool.Exec(ctx, "INSERT INTO crypto_transactions (user_id, type, tx_hash, status) VALUES ($1, 'deposit', $2, 'pending')", tgID, txHash)
	if err != nil {
		return fmt.Errorf("failed to insert deposit tx: %w", err)
	}

	return nil
}
