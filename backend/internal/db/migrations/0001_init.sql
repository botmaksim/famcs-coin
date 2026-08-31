-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    tg_id BIGINT PRIMARY KEY,
    username VARCHAR(100),
    custom_name VARCHAR(100) DEFAULT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',               -- user, admin, superadmin
    balance NUMERIC(20, 2) DEFAULT 0.00,
    energy INT DEFAULT 1000,
    max_energy INT DEFAULT 1000,
    passive_income NUMERIC(20, 2) DEFAULT 0.00,
    is_hidden BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Магазин пассивного дохода
CREATE TABLE IF NOT EXISTS upgrades (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(20, 2) NOT NULL,
    profit_increase NUMERIC(20, 2) NOT NULL,      -- Доход в минуту
    image_url TEXT
);

-- 3. Покупки пользователей в магазине
CREATE TABLE IF NOT EXISTS user_upgrades (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    upgrade_id INT REFERENCES upgrades(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    PRIMARY KEY (user_id, upgrade_id)
);

-- 4. Ставки (События)
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

-- 6. Обратная связь / Опросы (DAO)
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

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC) WHERE is_hidden = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_bets_event ON user_bets(event_id);
