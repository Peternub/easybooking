-- Исправление уникального ограничения для учета только активных записей
-- Проблема: текущее ограничение не позволяет создавать новые записи на время отмененных записей

-- Удаляем старое уникальное ограничение
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_master_id_booking_date_booking_time_key;

-- Создаем частичный уникальный индекс, который учитывает только активные и ожидающие записи
-- Отмененные и завершенные записи не будут блокировать создание новых записей
CREATE UNIQUE INDEX bookings_master_time_active_unique 
ON bookings (master_id, booking_date, booking_time) 
WHERE status IN ('active', 'pending');

-- Комментарий
COMMENT ON INDEX bookings_master_time_active_unique IS 
'Уникальное ограничение для времени записи мастера, применяется только к активным и ожидающим записям';
