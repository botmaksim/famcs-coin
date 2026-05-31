CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id BIGINT REFERENCES users(tg_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_user_id BIGINT REFERENCES users(tg_id) ON DELETE SET NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
