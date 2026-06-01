ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS crypto_transactions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    amount BIGINT NOT NULL,
    tx_hash VARCHAR(255) UNIQUE NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
