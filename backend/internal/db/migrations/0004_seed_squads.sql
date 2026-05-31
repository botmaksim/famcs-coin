-- Добавляем дефолтные сквады
INSERT INTO squads (name, total_points, pool_balance) VALUES 
('Совет Факультета', 500000, 0),
('Сборная по ICPC', 999999, 0),
('Любители Шаурмы', 15000, 0)
ON CONFLICT (name) DO NOTHING;
