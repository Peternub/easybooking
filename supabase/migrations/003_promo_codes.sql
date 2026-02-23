-- Таблица промокодов
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  client_telegram_id BIGINT NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_client ON promo_codes(client_telegram_id);
CREATE INDEX idx_promo_codes_valid ON promo_codes(valid_until) WHERE is_used = FALSE;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_codes_updated_at();

-- Комментарии
COMMENT ON TABLE promo_codes IS 'Промокоды для скидок';
COMMENT ON COLUMN promo_codes.code IS 'Уникальный код промокода';
COMMENT ON COLUMN promo_codes.client_telegram_id IS 'ID клиента в Telegram';
COMMENT ON COLUMN promo_codes.discount_percent IS 'Процент скидки (1-100)';
COMMENT ON COLUMN promo_codes.valid_from IS 'Дата начала действия';
COMMENT ON COLUMN promo_codes.valid_until IS 'Дата окончания действия';
COMMENT ON COLUMN promo_codes.is_used IS 'Использован ли промокод';
COMMENT ON COLUMN promo_codes.used_at IS 'Дата использования';
COMMENT ON COLUMN promo_codes.booking_id IS 'ID записи где использован промокод';
