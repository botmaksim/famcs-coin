CREATE TABLE IF NOT EXISTS IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reward_coins INTEGER NOT NULL,
    link_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS user_tasks (
    user_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id)
);

INSERT INTO tasks (title, description, reward_coins, link_url) VALUES 
('Подписаться на канал ФПМИ', 'Официальный канал нашего факультета. Новости и мемы.', 50000, 'https://t.me/famcs'),
('Вступить в чат первокурсников', 'Знакомься с коллегами по цеху и задавай вопросы.', 25000, 'https://t.me/famcs_chat')
ON CONFLICT DO NOTHING;
