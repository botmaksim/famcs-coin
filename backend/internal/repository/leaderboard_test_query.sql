SELECT 
    u.tg_id, u.username, u.custom_name, u.avatar_url, u.balance, u.passive_income,
    COUNT(CASE WHEN e.status = 'resolved' AND ub.payout > ub.amount THEN 1 END) as bets_won,
    COALESCE(SUM(CASE WHEN e.status = 'resolved' THEN ub.payout - ub.amount ELSE 0 END), 0) as bets_profit
FROM users u
LEFT JOIN user_bets ub ON u.tg_id = ub.user_id 
LEFT JOIN bet_events e ON ub.event_id = e.id
-- AND ub.created_at >= NOW() - INTERVAL '1 month'
WHERE u.is_hidden = FALSE
GROUP BY u.tg_id
ORDER BY bets_profit DESC
LIMIT 50;
