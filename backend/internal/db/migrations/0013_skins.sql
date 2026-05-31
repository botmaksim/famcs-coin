CREATE TABLE IF NOT EXISTS skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skins (
    user_id BIGINT REFERENCES users(tg_id) ON DELETE CASCADE,
    skin_id INT REFERENCES skins(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, skin_id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS active_skin_id INT REFERENCES skins(id) ON DELETE SET NULL;

INSERT INTO skins (name, price, image_url) VALUES 
('Базовый (FAMCS)', 0, '/logo.png'),
('Золотая монета', 50000, 'https://cdn3d.iconscout.com/3d/premium/thumb/coin-4993551-4161745.png'),
('Неоновый ФПМИ', 150000, 'https://cdn3d.iconscout.com/3d/premium/thumb/crypto-coin-4993550-4161744.png'),
('Аниме-Тян', 500000, 'https://cdn3d.iconscout.com/3d/premium/thumb/diamond-4993554-4161748.png')
ON CONFLICT DO NOTHING;
