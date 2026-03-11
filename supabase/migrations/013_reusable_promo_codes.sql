-- Добавляем поддержку многоразовых промокодов

-- Делаем client_telegram_id необязательным (для общих промокодов)
ALTER TABLE promo_codes 
  ALTER COLUMN client_telegram_id DROP NOT NULL;

-- Добавляем поля для многоразовых промокодов
ALTER TABLE promo_codes
  ADD COLUMN is_reusable BOOLEAN DEFAULT FALSE,
  ADD COLUMN usage_limit INTEGER,
  ADD COLUMN usage_count INTEGER DEFAULT 0;

-- Добавляем индекс для многоразовых промокодов
CREATE INDEX idx_promo_codes_reusable ON promo_codes(code) WHERE is_reusable = TRUE;

-- Комментарии
COMMENT ON COLUMN promo_codes.is_reusable IS 'Можно ли использовать промокод несколько раз';
COMMENT ON COLUMN promo_codes.usage_limit IS 'Максимальное количество использований (NULL = без ограничений)';
COMMENT ON COLUMN promo_codes.usage_count IS 'Количество использований';

-- Обновляем существующие промокоды (они все одноразовые)
UPDATE promo_codes SET is_reusable = FALSE WHERE is_reusable IS NULL;
