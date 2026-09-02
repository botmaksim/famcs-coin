DO $$
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS tmp_dedup_bets AS
    SELECT MIN(id) as keep_id, event_id, user_id, option_index, SUM(amount) as total_amount
    FROM user_bets
    GROUP BY event_id, user_id, option_index;

    UPDATE user_bets u
    SET amount = t.total_amount
    FROM tmp_dedup_bets t
    WHERE u.id = t.keep_id;

    DELETE FROM user_bets u
    WHERE NOT EXISTS (
        SELECT 1 FROM tmp_dedup_bets t WHERE t.keep_id = u.id
    );

    DROP TABLE IF EXISTS tmp_dedup_bets;
END $$;
