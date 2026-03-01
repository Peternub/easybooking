-- Применение миграции для добавления поля client_phone
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

-- Добавляем колонку client_phone
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone ON bookings(client_phone);

-- Обновляем представление bookings_readable
DROP VIEW IF EXISTS bookings_readable;
CREATE VIEW bookings_readable AS
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.source,
  COALESCE(c.name, b.client_name) as client_name,
  COALESCE(c.username, b.client_username) as client_username,
  COALESCE(c.phone, b.client_phone) as client_phone,
  c.notes as client_notes,
  m.name as master_name,
  s.name as service_name,
  s.price as service_price,
  b.final_price,
  b.promo_code,
  b.admin_notes,
  b.cancellation_reason,
  b.created_at
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
LEFT JOIN masters m ON b.master_id = m.id
LEFT JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC, b.booking_time DESC;

-- Проверка результата
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'client_phone';
