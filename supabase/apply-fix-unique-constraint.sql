-- Применение исправления уникального ограничения
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

-- Удаляем старое уникальное ограничение
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_master_id_booking_date_booking_time_key;

-- Создаем частичный уникальный индекс, который учитывает только активные и ожидающие записи
CREATE UNIQUE INDEX IF NOT EXISTS bookings_master_time_active_unique 
ON bookings (master_id, booking_date, booking_time) 
WHERE status IN ('active', 'pending');

-- Проверка результата
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'bookings' 
  AND indexname = 'bookings_master_time_active_unique';
