-- Создаём удобное представление для просмотра записей

CREATE OR REPLACE VIEW bookings_readable AS
SELECT 
  b.id,
  b.client_telegram_id,
  b.client_name AS "Имя клиента",
  b.client_username AS "Username",
  m.name AS "Мастер",
  s.name AS "Услуга",
  b.booking_date AS "Дата",
  b.booking_time AS "Время",
  b.status AS "Статус",
  b.final_price AS "Итоговая цена",
  b.promo_code AS "Промокод"
FROM bookings b
LEFT JOIN masters m ON b.master_id = m.id
LEFT JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC, b.booking_time DESC;

-- Комментарий
COMMENT ON VIEW bookings_readable IS 'Удобное представление записей с читаемыми названиями вместо ID';

-- Теперь можно использовать:
-- SELECT * FROM bookings_readable;
