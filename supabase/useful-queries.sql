-- Полезные SQL запросы для администрирования

-- ============================================================================
-- ПРОСМОТР ДАННЫХ
-- ============================================================================

-- Все активные записи с деталями
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.client_name,
  b.client_username,
  m.name as master_name,
  s.name as service_name,
  s.price,
  s.duration_minutes,
  b.status,
  b.created_at
FROM bookings b
JOIN masters m ON b.master_id = m.id
JOIN services s ON b.service_id = s.id
WHERE b.status = 'active'
ORDER BY b.booking_date, b.booking_time;

-- Статистика по мастерам
SELECT 
  m.name as master_name,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_bookings,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status LIKE 'cancelled%' THEN 1 END) as cancelled_bookings,
  AVG(r.rating) as average_rating,
  COUNT(r.id) as total_reviews
FROM masters m
LEFT JOIN bookings b ON m.id = b.master_id
LEFT JOIN reviews r ON m.id = r.master_id
GROUP BY m.id, m.name
ORDER BY total_bookings DESC;

-- Статистика по услугам
SELECT 
  s.name as service_name,
  s.category,
  s.price,
  COUNT(b.id) as total_bookings,
  SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END) as total_revenue
FROM services s
LEFT JOIN bookings b ON s.id = b.service_id
GROUP BY s.id, s.name, s.category, s.price
ORDER BY total_bookings DESC;

-- Отзывы с деталями
SELECT 
  r.rating,
  r.comment,
  r.created_at,
  b.client_name,
  m.name as master_name,
  s.name as service_name
FROM reviews r
JOIN bookings b ON r.booking_id = b.id
JOIN masters m ON r.master_id = m.id
JOIN services s ON r.service_id = s.id
ORDER BY r.created_at DESC;

-- ============================================================================
-- ДОБАВЛЕНИЕ ДАННЫХ
-- ============================================================================

-- Добавить нового мастера
INSERT INTO masters (name, photo_url, description, specialization, google_calendar_id, is_active)
VALUES (
  'Имя Мастера',
  'https://example.com/photo.jpg',
  'Описание мастера',
  'Специализация',
  'calendar_id@group.calendar.google.com',
  true
);

-- Добавить новую услугу
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES (
  'Название услуги',
  'Описание услуги',
  2000,
  60,
  'Категория',
  true
);

-- Связать мастера с услугой
INSERT INTO master_services (master_id, service_id)
VALUES (
  'master_uuid_here',
  'service_uuid_here'
);

-- Добавить график работы мастера (Пн-Пт, 10:00-19:00)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT 
  'master_uuid_here',
  day,
  '10:00',
  '19:00',
  true
FROM generate_series(0, 4) as day;

-- Добавить выходной день (Сб-Вс)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
VALUES 
  ('master_uuid_here', 5, '00:00', '00:00', false),
  ('master_uuid_here', 6, '00:00', '00:00', false);

-- Добавить исключение (отпуск)
INSERT INTO master_schedule_exceptions (master_id, date, reason)
VALUES (
  'master_uuid_here',
  '2026-03-15',
  'Отпуск'
);

-- Добавить администратора
INSERT INTO admins (telegram_id, name)
VALUES (
  123456789,
  'Имя Администратора'
);

-- ============================================================================
-- ОБНОВЛЕНИЕ ДАННЫХ
-- ============================================================================

-- Изменить цену услуги
UPDATE services
SET price = 2500
WHERE name = 'Название услуги';

-- Деактивировать мастера
UPDATE masters
SET is_active = false
WHERE name = 'Имя Мастера';

-- Изменить график работы
UPDATE master_schedules
SET start_time = '09:00', end_time = '18:00'
WHERE master_id = 'master_uuid_here' AND day_of_week = 0;

-- Отменить запись администратором
UPDATE bookings
SET 
  status = 'cancelled_by_admin',
  cancellation_reason = 'Причина отмены'
WHERE id = 'booking_uuid_here';

-- ============================================================================
-- УДАЛЕНИЕ ДАННЫХ
-- ============================================================================

-- Удалить связь мастера с услугой
DELETE FROM master_services
WHERE master_id = 'master_uuid_here' AND service_id = 'service_uuid_here';

-- Удалить исключение в графике
DELETE FROM master_schedule_exceptions
WHERE master_id = 'master_uuid_here' AND date = '2026-03-15';

-- Удалить старые отмененные записи (старше 3 месяцев)
DELETE FROM bookings
WHERE status LIKE 'cancelled%'
  AND created_at < NOW() - INTERVAL '3 months';

-- ============================================================================
-- АНАЛИТИКА
-- ============================================================================

-- Загруженность по дням недели
SELECT 
  EXTRACT(DOW FROM booking_date) as day_of_week,
  CASE EXTRACT(DOW FROM booking_date)
    WHEN 0 THEN 'Воскресенье'
    WHEN 1 THEN 'Понедельник'
    WHEN 2 THEN 'Вторник'
    WHEN 3 THEN 'Среда'
    WHEN 4 THEN 'Четверг'
    WHEN 5 THEN 'Пятница'
    WHEN 6 THEN 'Суббота'
  END as day_name,
  COUNT(*) as bookings_count
FROM bookings
WHERE status = 'completed'
GROUP BY day_of_week
ORDER BY day_of_week;

-- Популярные временные слоты
SELECT 
  booking_time,
  COUNT(*) as bookings_count
FROM bookings
WHERE status = 'completed'
GROUP BY booking_time
ORDER BY bookings_count DESC
LIMIT 10;

-- Выручка по месяцам
SELECT 
  DATE_TRUNC('month', b.booking_date) as month,
  COUNT(b.id) as total_bookings,
  SUM(s.price) as total_revenue
FROM bookings b
JOIN services s ON b.service_id = s.id
WHERE b.status = 'completed'
GROUP BY month
ORDER BY month DESC;

-- Процент отмен
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status LIKE 'cancelled%' THEN 1 END) as cancelled,
  ROUND(
    COUNT(CASE WHEN status LIKE 'cancelled%' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as cancellation_rate
FROM bookings;

-- Средний рейтинг по мастерам
SELECT 
  m.name,
  COUNT(r.id) as reviews_count,
  ROUND(AVG(r.rating), 2) as average_rating,
  COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
FROM masters m
LEFT JOIN reviews r ON m.id = r.master_id
GROUP BY m.id, m.name
ORDER BY average_rating DESC;

-- ============================================================================
-- ОБСЛУЖИВАНИЕ
-- ============================================================================

-- Найти дубликаты записей (одинаковые мастер, дата, время)
SELECT 
  master_id,
  booking_date,
  booking_time,
  COUNT(*) as duplicates
FROM bookings
WHERE status = 'active'
GROUP BY master_id, booking_date, booking_time
HAVING COUNT(*) > 1;

-- Найти записи без событий в календаре
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.client_name,
  m.name as master_name
FROM bookings b
JOIN masters m ON b.master_id = m.id
WHERE b.status = 'active' 
  AND b.google_event_id IS NULL;

-- Очистка тестовых данных
-- ВНИМАНИЕ: Используйте с осторожностью!
-- DELETE FROM bookings WHERE client_name LIKE '%Тест%';
-- DELETE FROM reviews WHERE comment LIKE '%тест%';

-- Сброс последовательностей (если нужно)
-- ALTER SEQUENCE bookings_id_seq RESTART WITH 1;

-- ============================================================================
-- РЕЗЕРВНОЕ КОПИРОВАНИЕ
-- ============================================================================

-- Экспорт всех записей в CSV (выполнить через psql или Supabase Dashboard)
-- COPY (SELECT * FROM bookings) TO '/tmp/bookings_backup.csv' CSV HEADER;

-- Экспорт отзывов
-- COPY (SELECT * FROM reviews) TO '/tmp/reviews_backup.csv' CSV HEADER;
