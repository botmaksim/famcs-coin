-- Индексы для ускорения фильтрации (DAO и Крипта)
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_crypto_tx_status ON crypto_transactions(status);

-- Индексы для внешних ключей (устраняет Full Table Scan при каскадном удалении или джоинах)
CREATE INDEX IF NOT EXISTS idx_crypto_tx_user_id ON crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quizzes_user_id ON user_quizzes(user_id);
