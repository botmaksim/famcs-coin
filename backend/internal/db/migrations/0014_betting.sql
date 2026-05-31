CREATE TABLE IF NOT EXISTS bet_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    option_a_name VARCHAR(100) NOT NULL,
    option_b_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'canceled'
    winning_option VARCHAR(10) NULL, -- 'A', 'B'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_bets (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    event_id INT REFERENCES bet_events(id) ON DELETE CASCADE,
    chosen_option VARCHAR(10) NOT NULL, -- 'A', 'B'
    amount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

INSERT INTO bet_events (title, option_a_name, option_b_name) VALUES 
('Кто победит на хакатоне?', 'Команда ФПМИ', 'Команда БГУИР'),
('Когда выйдет релиз кликера?', 'Сегодня', 'Завтра')
ON CONFLICT DO NOTHING;
