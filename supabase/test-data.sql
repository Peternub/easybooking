-- Тестовые данные для быстрого старта
-- Скопируйте весь этот файл и выполните в Supabase SQL Editor

-- 1. Добавление мастера
INSERT INTO masters (name, photo_url, description, specialization, google_calendar_id, is_active)
VALUES (
  'Анна Иванова',
  'https://i.pravatar.cc/150?img=5',
  'Опытный мастер с 5-летним стажем работы',
  'Парикмахер-стилист',
  'primary',
  true
);

-- 2. Добавление услуг
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES 
  ('Стрижка женская', 'Модельная стрижка с укладкой', 2000, 60, 'Парикмахерские услуги', true),
  ('Стрижка мужская', 'Классическая мужская стрижка', 1500, 45, 'Парикмахерские услуги', true),
  ('Окрашивание', 'Окрашивание волос профессиональными красителями', 3500, 120, 'Парикмахерские услуги', true),
  ('Маникюр', 'Классический маникюр с покрытием гель-лак', 1800, 60, 'Маникюр', true),
  ('Педикюр', 'Классический педикюр с покрытием', 2200, 90, 'Педикюр', true);

-- 3. Связь мастера со всеми услугами
INSERT INTO master_services (master_id, service_id)
SELECT m.id, s.id
FROM masters m
CROSS JOIN services s
WHERE m.name = 'Анна Иванова';

-- 4. График работы мастера (Пн-Пт: 10:00-19:00, Сб: 10:00-16:00, Вс: выходной)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, 0, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 1, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 2, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 3, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 4, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 5, '10:00:00'::time, '16:00:00'::time, true FROM masters m WHERE m.name = 'Анна Иванова'
UNION ALL
SELECT m.id, 6, '00:00:00'::time, '00:00:00'::time, false FROM masters m WHERE m.name = 'Анна Иванова';

-- Готово! Проверьте результат:
SELECT 'Мастеров добавлено:' as info, COUNT(*) as count FROM masters
UNION ALL
SELECT 'Услуг добавлено:', COUNT(*) FROM services
UNION ALL
SELECT 'Связей мастер-услуга:', COUNT(*) FROM master_services
UNION ALL
SELECT 'Записей в графике:', COUNT(*) FROM master_schedules;
