-- Расширение функционала для админ панели

-- 1. Добавляем график работы мастеров
ALTER TABLE masters ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{
  "monday": ["10:00-18:00"],
  "tuesday": ["10:00-18:00"],
  "wednesday": ["10:00-18:00"],
  "thursday": ["10:00-18:00"],
  "friday": ["10:00-18:00"],
  "saturday": ["10:00-18:00"],
  "sunday": []
}'::jsonb;

-- 2. Добавляем телефон мастера
ALTER TABLE masters ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Расширяем статусы записей
-- Текущие: 'active', 'completed', 'cancelled'
-- Добавляем: 'pending' (ожидает подтверждения), 'no_show' (не пришел)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'no_show'));

-- 4. Добавляем источник записи (онлайн или вручную)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online' CHECK (source IN ('online', 'manual', 'phone', 'walk_in'));

-- 5. Добавляем связь с таблицей клиентов
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 6. Создаем индекс для быстрого поиска записей по клиенту
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);

-- 7. Добавляем поле для заметок администратора к записи
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 8. Обновляем view для читаемого отображения
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
  c.phone as client_phone,
  c.notes as client_notes,
  m.name as master_name,
  s.name as service_name,
  s.price as service_price,
  b.final_price,
  b.promo_code,
  b.admin_notes,
  b.created_at
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
LEFT JOIN masters m ON b.master_id = m.id
LEFT JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC, b.booking_time DESC;

-- Комментарии
COMMENT ON COLUMN masters.work_schedule IS 'График работы мастера в формате JSON';
COMMENT ON COLUMN bookings.source IS 'Источник записи: online, manual, phone, walk_in';
COMMENT ON COLUMN bookings.client_id IS 'Связь с таблицей клиентов';
COMMENT ON COLUMN bookings.admin_notes IS 'Заметки администратора к записи';
