INSERT INTO upgrades (title, description, base_price, profit_increase, image_url)
SELECT 'Шаурма из Жанчика', 'Легендарная шаурма, заряжающая энергией на весь день и повышающая пассивный доход.', 2000.00, 150.00, '/shawarma.png'
WHERE NOT EXISTS (SELECT 1 FROM upgrades);
