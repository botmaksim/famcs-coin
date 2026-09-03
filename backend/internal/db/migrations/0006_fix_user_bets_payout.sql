-- Ensure all user_bets rows have non-null payout, defaulting to 0.00
UPDATE user_bets
SET payout = 0.00
WHERE payout IS NULL;

ALTER TABLE user_bets ALTER COLUMN payout SET DEFAULT 0.00;
