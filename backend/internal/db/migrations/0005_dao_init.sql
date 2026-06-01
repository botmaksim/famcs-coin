CREATE TABLE IF NOT EXISTS IF NOT EXISTS user_votes (
    user_id BIGINT NOT NULL REFERENCES users(tg_id) ON DELETE CASCADE,
    proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, proposal_id)
);

INSERT INTO proposals (title, description, status) VALUES 
('Заменить стандартную капчу на задачи с Mathforces', 'Решим проблему ботов радикально. Заодно подтянем математику у первокурсников.', 'active'),
('Интегрировать движок pawnGO в качестве босса уровня', 'Каждый студент должен уметь побеждать баги в движке.', 'active')
ON CONFLICT DO NOTHING;
