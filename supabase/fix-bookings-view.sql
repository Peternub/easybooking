-- Пересоздание view bookings_readable с правильными полями

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

-- Проверка: должны увидеть все записи
SELECT * FROM bookings_readable LIMIT 10;

-- Проверка: сколько всего записей
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as readable_bookings FROM bookings_readable;
