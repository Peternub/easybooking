-- Добавление пробного промокода qwerty11 на скидку 11%
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

INSERT INTO promo_codes (
  code,
  discount_percent,
  is_active,
  usage_limit,
  used_count,
  valid_from,
  valid_until,
  description
) VALUES (
  'QWERTY11',
  11,
  true,
  NULL, -- без ограничения использований
  0,
  NOW(),
  NULL, -- без срока действия
  'Пробный промокод на скидку 11%'
);

-- Проверка результата
SELECT * FROM promo_codes WHERE code = 'QWERTY11';
