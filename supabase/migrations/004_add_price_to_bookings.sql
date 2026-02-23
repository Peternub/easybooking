-- Добавляем поля цены и промокода в таблицу bookings

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS original_price INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price INTEGER,
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(20);

-- Комментарии
COMMENT ON COLUMN bookings.original_price IS 'Исходная цена услуги';
COMMENT ON COLUMN bookings.discount_amount IS 'Сумма скидки по промокоду';
COMMENT ON COLUMN bookings.final_price IS 'Итоговая цена с учётом скидки';
COMMENT ON COLUMN bookings.promo_code IS 'Использованный промокод';

-- Индекс для поиска по промокоду
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON bookings(promo_code);
