SELECT 
    u.tg_id, u.username, u.custom_name, u.avatar_url, u.balance, u.passive_income,
    COUNT(CASE WHEN ub.payout > ub.amount THEN 1 END) as bets_won,
    COALESCE(SUM(ub.payout - ub.amount), 0) as bets_profit
FROM users u
LEFT JOIN user_bets ub ON u.tg_id = ub.user_id 
-- AND ub.created_at >= NOW() - INTERVAL '1 month'
WHERE u.is_hidden = FALSE
GROUP BY u.tg_id
ORDER BY bets_profit DESC
LIMIT 50;
