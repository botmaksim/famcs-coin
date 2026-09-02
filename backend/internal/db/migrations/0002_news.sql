-- 8. Новости и идеи развития
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    likes_count INT DEFAULT 0,
    dislikes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Голоса за новости и идеи
CREATE TABLE IF NOT EXISTS news_votes (
    news_id INT REFERENCES news(id) ON DELETE CASCADE,
    voter_id VARCHAR(100) NOT NULL,
    vote_type VARCHAR(10) NOT NULL, -- 'like' or 'dislike'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (news_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
