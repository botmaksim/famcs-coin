-- ============================================================================
-- FAMCS Coin Database Schema (Single Consolidated Migration)
-- ============================================================================

-- 1. Пользователи
CREATE TABLE IF NOT EXISTS users (
    tg_id BIGINT PRIMARY KEY,
    username VARCHAR(100),
    first_name VARCHAR(100) DEFAULT NULL,
    custom_name VARCHAR(100) DEFAULT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',               -- 'user', 'admin', 'superadmin'
    balance NUMERIC(20, 2) DEFAULT 0.00,
    energy INT DEFAULT 1000,
    max_energy INT DEFAULT 1000,
    passive_income NUMERIC(20, 2) DEFAULT 0.00,
    is_hidden BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Обеспечение наличия колонок для существующих баз данных
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 2. Магазин улучшений (пассивный доход)
CREATE TABLE IF NOT EXISTS upgrades (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(20, 2) NOT NULL,
    profit_increase NUMERIC(20, 2) NOT NULL,      -- Доход в час
    image_url TEXT
);

-- 3. Купленные улучшения пользователей
CREATE TABLE IF NOT EXISTS user_upgrades (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    upgrade_id INT REFERENCES upgrades(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    PRIMARY KEY (user_id, upgrade_id)
);

-- 4. События для ставок (тотализатор)
CREATE TABLE IF NOT EXISTS bet_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    options JSONB NOT NULL,                        -- ["Вариант 1", "Вариант 2"]
    status VARCHAR(20) DEFAULT 'open',             -- 'open', 'closed', 'resolved'
    closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
    winning_option_index INT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ставки пользователей
CREATE TABLE IF NOT EXISTS user_bets (
    id BIGSERIAL PRIMARY KEY,
    event_id INT REFERENCES bet_events(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    payout NUMERIC(20, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_bets ALTER COLUMN payout SET DEFAULT 0.00;
UPDATE user_bets SET payout = 0.00 WHERE payout IS NULL;

-- 6. Обратная связь / Идеи пользователей (DAO)
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',          -- 'pending', 'interesting', 'unimportant'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Транзакции (Логирование экономики)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL,
    type VARCHAR(30) NOT NULL,                     -- 'click', 'shop_buy', 'shop_sell', 'bet_place', 'bet_payout', 'passive_income'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Новости и идеи развития
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'open',             -- 'open', 'in_progress', 'implemented', 'rejected', 'closed'
    verdict TEXT DEFAULT NULL,
    verdict_note TEXT DEFAULT NULL,
    likes_count INT DEFAULT 0,
    dislikes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE news ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
ALTER TABLE news ADD COLUMN IF NOT EXISTS verdict TEXT DEFAULT NULL;
ALTER TABLE news ADD COLUMN IF NOT EXISTS verdict_note TEXT DEFAULT NULL;

-- 9. Голоса за новости и идеи
CREATE TABLE IF NOT EXISTS news_votes (
    news_id INT REFERENCES news(id) ON DELETE CASCADE,
    voter_id VARCHAR(100) NOT NULL,
    vote_type VARCHAR(10) NOT NULL,                -- 'like' или 'dislike'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (news_id, voter_id)
);

-- 10. Динамический контент страниц (баннеры, заголовки, рич-текст)
CREATE TABLE IF NOT EXISTS site_content (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы производительности
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_bets_event ON user_bets(event_id);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- Начальные данные (Seed)
INSERT INTO upgrades (title, description, base_price, profit_increase, image_url)
SELECT 'Шаурма из Жанчика', 'Легендарная шаурма, заряжающая энергией на весь день и повышающая пассивный доход.', 2000.00, 150.00, '/shawarma.png'
WHERE NOT EXISTS (SELECT 1 FROM upgrades);

INSERT INTO site_content (key, value) VALUES 
    ('news_header_title', 'Новости и Идеи Развития'),
    ('news_header_subtitle', 'Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!'),
    ('news_banner_markdown', '')
ON CONFLICT (key) DO NOTHING;
