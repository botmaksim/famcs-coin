-- 1. Таблица сквадов (Вертикальных групп, сквозных через курсы)
CREATE TABLE squads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,             -- Например, "11 группа"
    total_points NUMERIC(20, 2) DEFAULT 0.00,     -- Общий исторический счет группы
    pool_balance NUMERIC(20, 2) DEFAULT 0.00,    -- Текущий баланс общака на буст
    pool_target NUMERIC(20, 2) DEFAULT 50000.00, -- Сколько нужно собрать на буст
    boost_active_until TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 2. Таблица пользователей
CREATE TABLE users (
    tg_id BIGINT PRIMARY KEY,                      -- Telegram ID выступает основным ключом
    username VARCHAR(100),
    custom_name VARCHAR(100) DEFAULT NULL,        -- Кастомный ник для маскировки в топе
    role VARCHAR(20) DEFAULT 'user',               -- user, admin, superadmin
    balance NUMERIC(20, 2) DEFAULT 0.00,
    energy INT DEFAULT 1000,
    max_energy INT DEFAULT 1000,
    passive_income NUMERIC(20, 2) DEFAULT 0.00,   -- Суммарный заработок в час
    squad_id INT REFERENCES squads(id),            -- Жесткая привязка к группе
    is_hidden BOOLEAN DEFAULT FALSE,               -- Скрыть из лидерборда
    is_anonymous_tips BOOLEAN DEFAULT FALSE,       -- Анонимные чаевые в беседах
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Для отстраненных админов
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Справочник апгрейдов и персонажей (Заполняется из админки)
CREATE TABLE upgrades (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,                 -- 'click', 'passive', 'meme'
    base_price NUMERIC(20, 2) NOT NULL,
    price_multiplier NUMERIC(4, 2) DEFAULT 1.5,   -- На сколько умножается цена с каждым уровнем
    profit_increase NUMERIC(20, 2) NOT NULL,      -- Что дает (+ к тапу или + к пассивке в час)
    image_url TEXT
);

-- 4. Связующая таблица купленных апгрейдов юзеров
CREATE TABLE user_upgrades (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    upgrade_id INT REFERENCES upgrades(id) ON DELETE CASCADE,
    level INT DEFAULT 1,
    PRIMARY KEY (user_id, upgrade_id)
);

-- 5. История транзакций (Для логов, аналитики и чаевых)
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(tg_id),      -- Может быть NULL (если начислила система)
    receiver_id BIGINT REFERENCES users(tg_id),    -- Может быть NULL (если покупка в магазине)
    squad_id INT REFERENCES squads(id),            -- Заполнено, если донат в общак
    amount NUMERIC(20, 2) NOT NULL,
    type VARCHAR(30) NOT NULL,                     -- 'click', 'tip', 'shop_buy', 'squad_donate', 'bet_place', 'bet_payout', 'quiz_reward', 'bonus'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Пул ежедневных викторин
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,                        -- Массив вариантов ответов: ["Option 1", "Option 2"]
    correct_option INT NOT NULL,                   -- Индекс правильного ответа
    reward NUMERIC(20, 2) NOT NULL,
    active_date DATE UNIQUE                        -- На какой день назначена задача
);

-- 7. Результаты викторин юзеров (Чтобы исключить повторное прохождение)
CREATE TABLE user_quizzes (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, quiz_id)
);

-- 8. События тотализатора
CREATE TABLE bet_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    options JSONB NOT NULL,                        -- Варианты исходов: ["Да", "Нет"]
    status VARCHAR(20) DEFAULT 'open',             -- 'open' (прием ставок), 'closed' (событие началось), 'resolved' (расчитано), 'refunded' (отменено)
    winner_option_index INT DEFAULT NULL,
    pool_size NUMERIC(20, 2) DEFAULT 0.00,
    created_by BIGINT REFERENCES users(tg_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Ставки пользователей
CREATE TABLE user_bets (
    id BIGSERIAL PRIMARY KEY,
    event_id INT REFERENCES bet_events(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    selected_option INT NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    payout NUMERIC(20, 2) DEFAULT 0.00,            -- Заполняется при выигрыше или возврате
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Таблица предложений фич (DAO)
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(tg_id),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',          -- 'pending', 'approved', 'rejected', 'implemented'
    votes_up INT DEFAULT 0,
    votes_down INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_balance ON users(balance DESC) WHERE is_hidden = FALSE; -- Быстрый рендер топа юзеров
CREATE INDEX idx_squads_points ON squads(total_points DESC);                 -- Быстрый рендер топа групп
CREATE INDEX idx_quizzes_date ON quizzes(active_date);                       -- Поиск викторины на сегодня
CREATE INDEX idx_user_bets_event ON user_bets(event_id);                     -- Выборка всех ставок для распределения пула
