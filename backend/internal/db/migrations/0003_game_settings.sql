CREATE TABLE IF NOT EXISTS IF NOT EXISTS game_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT
);

INSERT INTO game_settings (key, value, description) VALUES
('squad_creation_price', '50000', 'Стоимость создания новой группы (сквада)'),
('dao_proposal_price', '10000', 'Стоимость внесения инициативы на голосование'),
('daily_quiz_reward', '1000', 'Награда за правильный ответ в ежедневной викторине'),
('referral_reward', '50000', 'Награда за приглашенного реферала')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;
