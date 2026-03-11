-- Добавление тестового промокода QWERTY11
-- Выполните этот скрипт в SQL Editor на dashboard.supabase.com
-- ВАЖНО: Сначала примените миграцию 013_reusable_promo_codes.sql

INSERT INTO promo_codes (
  code,
  discount_percent,
  valid_from,
  valid_until,
  is_reusable,
  usage_limit
) VALUES (
  'QWERTY11',
  11,
  NOW(),
  NOW() + INTERVAL '1 year',
  TRUE,
  NULL  -- без ограничений на количество использований
)
ON CONFLICT (code) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent,
  valid_until = EXCLUDED.valid_until,
  is_reusable = EXCLUDED.is_reusable,
  usage_limit = EXCLUDED.usage_limit;

-- Проверка результата
SELECT * FROM promo_codes WHERE code = 'QWERTY11';
