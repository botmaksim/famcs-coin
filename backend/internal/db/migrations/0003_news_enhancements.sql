-- Расширение новостей: статусы опросов, вердикт и комментарий администрации
ALTER TABLE news ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
ALTER TABLE news ADD COLUMN IF NOT EXISTS verdict TEXT DEFAULT NULL;
ALTER TABLE news ADD COLUMN IF NOT EXISTS verdict_note TEXT DEFAULT NULL;

-- Таблица для динамического контента страниц (рич-текст, баннеры, заголовки)
CREATE TABLE IF NOT EXISTS site_content (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_content (key, value) VALUES 
    ('news_header_title', 'Новости и Идеи Развития'),
    ('news_header_subtitle', 'Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!'),
    ('news_banner_markdown', '')
ON CONFLICT (key) DO NOTHING;
