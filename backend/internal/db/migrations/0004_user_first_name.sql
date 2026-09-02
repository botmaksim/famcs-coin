-- Add first_name to distinguish display name (ник) from Telegram @username (юз)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT NULL;
