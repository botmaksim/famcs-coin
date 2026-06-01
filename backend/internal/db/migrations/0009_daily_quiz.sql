CREATE TABLE IF NOT EXISTS IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    active_date DATE UNIQUE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    reward INT NOT NULL DEFAULT 100000
);

CREATE TABLE IF NOT EXISTS IF NOT EXISTS user_quizzes (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    quiz_date DATE NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quiz_date)
);

-- Стартовый сложный квиз по комбинаторике на сегодня
INSERT INTO quizzes (active_date, question, answer, reward)
VALUES (
    CURRENT_DATE,
    'Каково максимальное число областей, на которые могут разбить плоскость 20 прямых, среди которых нет параллельных, и никакие три не пересекаются в одной точке?',
    '211',
    100000
) ON CONFLICT (active_date) DO NOTHING;
