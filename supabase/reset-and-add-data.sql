-- Полная замена тестовых данных
-- Удаляем старые данные и добавляем новые

-- 1. Очистка всех таблиц
DELETE FROM master_schedules;
DELETE FROM master_services;
DELETE FROM bookings;
DELETE FROM services;
DELETE FROM masters;

-- 2. Добавление трех мастеров-парикмахеров
INSERT INTO masters (name, photo_url, description, google_calendar_id, is_active)
VALUES 
  (
    'Анна Иванова',
    'https://i.pravatar.cc/150?img=5',
    'Опытный мастер с 5-летним стажем работы',
    'primary',
    true
  ),
  (
    'Мария Петрова',
    'https://i.pravatar.cc/150?img=9',
    'Профессиональный мастер, специалист по окрашиванию',
    null,
    true
  ),
  (
    'Елена Сидорова',
    'https://i.pravatar.cc/150?img=10',
    'Мастер с опытом работы более 7 лет',
    null,
    true
  );

-- 3. Добавление услуг
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES 
  ('Окрашивание волос', 'Профессиональное окрашивание волос', 3500, 120, 'Парикмахерские услуги', true),
  ('Детская стрижка', 'Стрижка для детей до 12 лет', 1000, 30, 'Парикмахерские услуги', true),
  ('Мужская стрижка', 'Классическая мужская стрижка', 1500, 45, 'Парикмахерские услуги', true),
  ('Папа + сын', 'Стрижка для папы и сына (комплект)', 2200, 60, 'Парикмахерские услуги', true);

-- 4. Связь всех мастеров со всеми услугами
INSERT INTO master_services (master_id, service_id)
SELECT m.id, s.id
FROM masters m
CROSS JOIN services s;

-- 5. График работы для всех мастеров (Пн-Пт: 10:00-19:00, Сб: 10:00-16:00, Вс: выходной)
-- Анна Иванова
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

-- Мария Петрова
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, 0, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 1, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 2, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 3, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 4, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 5, '10:00:00'::time, '16:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 6, '00:00:00'::time, '00:00:00'::time, false FROM masters m WHERE m.name = 'Мария Петрова';

-- Елена Сидорова
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, 0, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 1, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 2, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 3, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 4, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 5, '10:00:00'::time, '16:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 6, '00:00:00'::time, '00:00:00'::time, false FROM masters m WHERE m.name = 'Елена Сидорова';

-- Проверка результата
SELECT '=== МАСТЕРА ===' as info;
SELECT 
  name as "Имя",
  specialization as "Специализация",
  CASE WHEN google_calendar_id IS NOT NULL THEN 'Да' ELSE 'Нет' END as "Google Calendar"
FROM masters
ORDER BY name;

SELECT '=== УСЛУГИ ===' as info;
SELECT 
  name as "Название",
  price as "Цена (₽)",
  duration_minutes as "Длительность (мин)"
FROM services
ORDER BY name;

SELECT '=== СТАТИСТИКА ===' as info;
SELECT 'Мастеров:' as "Показатель", COUNT(*) as "Количество" FROM masters
UNION ALL
SELECT 'Услуг:', COUNT(*) FROM services
UNION ALL
SELECT 'Связей мастер-услуга:', COUNT(*) FROM master_services
UNION ALL
SELECT 'Записей в графике:', COUNT(*) FROM master_schedules;

SELECT '✅ Данные успешно обновлены!' as status;
SELECT 'ℹ️ Уникальное ограничение на (master_id, booking_date, booking_time) не позволит двум людям записаться к одному мастеру на одно время' as note;
