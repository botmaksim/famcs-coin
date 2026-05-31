-- Добавляем несколько базовых карточек для старта экономики
INSERT INTO upgrades (title, description, category, base_price, price_multiplier, profit_increase, image_url) VALUES 
('Писать скрипты на Node.js', 'Твой первый шаг в мир бэкенда. Приносит небольшой, но стабильный доход.', 'passive', 100, 1.3, 50, '/images/nodejs.png'),
('Поднять сервер на Debian', 'Ты понял, что Windows Server — это боль. Переезд на Linux дает отличный буст.', 'passive', 500, 1.4, 300, '/images/debian.png'),
('Выучить Golang', 'Теперь ты настоящий сеньор. Горутины делают деньги за тебя.', 'passive', 2000, 1.5, 1500, '/images/golang.png'),
('Правило 67', 'Никто не знает, что это, но декан одобряет. Мощнейший мемный буст.', 'meme', 5000, 1.6, 4000, '/images/rule67.png')
ON CONFLICT DO NOTHING;
