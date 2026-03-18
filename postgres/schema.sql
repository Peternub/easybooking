-- Базовая схема EasyBooking для PostgreSQL.
-- Этот файл используется для разворачивания нового проекта.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  specialization TEXT,
  phone TEXT,
  work_schedule JSONB NOT NULL DEFAULT '{
    "monday": ["10:00-18:00"],
    "tuesday": ["10:00-18:00"],
    "wednesday": ["10:00-18:00"],
    "thursday": ["10:00-18:00"],
    "friday": ["10:00-18:00"],
    "saturday": ["10:00-18:00"],
    "sunday": []
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  username TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS master_services (
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, service_id)
);

CREATE TABLE IF NOT EXISTS master_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (master_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS master_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('vacation', 'sick_leave', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT master_absences_valid_date_range CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_telegram_id BIGINT NOT NULL,
  client_name TEXT NOT NULL,
  client_username TEXT,
  client_phone TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'no_show')),
  source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'manual', 'phone', 'walk_in')),
  cancellation_reason TEXT,
  admin_notes TEXT,
  original_price INTEGER,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  final_price INTEGER,
  promo_code VARCHAR(20),
  reminder_24h_sent_at TIMESTAMPTZ,
  reminder_1h_sent_at TIMESTAMPTZ,
  review_request_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  client_telegram_id BIGINT NOT NULL,
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  telegram_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  client_telegram_id BIGINT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  is_reusable BOOLEAN NOT NULL DEFAULT FALSE,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_masters_active ON masters(is_active);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_telegram_id ON clients(telegram_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_master_absences_master_id ON master_absences(master_id);
CREATE INDEX IF NOT EXISTS idx_master_absences_dates ON master_absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_telegram_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_phone ON bookings(client_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_master ON bookings(master_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON bookings(promo_code);
CREATE INDEX IF NOT EXISTS idx_reviews_master ON reviews(master_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_client ON promo_codes(client_telegram_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid ON promo_codes(valid_until) WHERE is_used = FALSE;
CREATE INDEX IF NOT EXISTS idx_promo_codes_reusable ON promo_codes(code) WHERE is_reusable = TRUE;

CREATE OR REPLACE FUNCTION sync_client_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  IF NEW.client_telegram_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
  INTO v_client_id
  FROM clients
  WHERE telegram_id = NEW.client_telegram_id;

  IF v_client_id IS NULL THEN
    INSERT INTO clients (telegram_id, name, username, phone)
    VALUES (NEW.client_telegram_id, NEW.client_name, NEW.client_username, NEW.client_phone)
    RETURNING id INTO v_client_id;
  ELSE
    UPDATE clients
    SET
      name = COALESCE(NEW.client_name, name),
      username = COALESCE(NEW.client_username, username),
      phone = COALESCE(NEW.client_phone, phone),
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;

  NEW.client_id = v_client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS masters_set_updated_at ON masters;
CREATE TRIGGER masters_set_updated_at
BEFORE UPDATE ON masters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS services_set_updated_at ON services;
CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS clients_set_updated_at ON clients;
CREATE TRIGGER clients_set_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS master_absences_set_updated_at ON master_absences;
CREATE TRIGGER master_absences_set_updated_at
BEFORE UPDATE ON master_absences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS promo_codes_set_updated_at ON promo_codes;
CREATE TRIGGER promo_codes_set_updated_at
BEFORE UPDATE ON promo_codes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS sync_client_on_booking ON bookings;
CREATE TRIGGER sync_client_on_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_client_from_booking();

DROP VIEW IF EXISTS bookings_readable;
CREATE VIEW bookings_readable AS
SELECT
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.source,
  COALESCE(c.name, b.client_name) AS client_name,
  COALESCE(c.username, b.client_username) AS client_username,
  COALESCE(c.phone, b.client_phone) AS client_phone,
  c.notes AS client_notes,
  m.name AS master_name,
  s.name AS service_name,
  s.price AS service_price,
  b.final_price,
  b.promo_code,
  b.admin_notes,
  b.cancellation_reason,
  b.created_at
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
LEFT JOIN masters m ON b.master_id = m.id
LEFT JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC, b.booking_time DESC;

COMMENT ON TABLE masters IS 'РњР°СЃС‚РµСЂР° СЃР°Р»РѕРЅР°';
COMMENT ON TABLE services IS 'РЈСЃР»СѓРіРё СЃР°Р»РѕРЅР°';
COMMENT ON TABLE clients IS 'РљР»РёРµРЅС‚С‹ СЃР°Р»РѕРЅР°';
COMMENT ON TABLE bookings IS 'Р—Р°РїРёСЃРё РєР»РёРµРЅС‚РѕРІ';
COMMENT ON TABLE reviews IS 'РћС‚Р·С‹РІС‹ РєР»РёРµРЅС‚РѕРІ';
COMMENT ON TABLE promo_codes IS 'РџСЂРѕРјРѕРєРѕРґС‹ СЃР°Р»РѕРЅР°';
COMMENT ON TABLE master_absences IS 'РћС‚РїСѓСЃРєР° Рё Р±РѕР»СЊРЅРёС‡РЅС‹Рµ РјР°СЃС‚РµСЂРѕРІ';
COMMENT ON VIEW bookings_readable IS 'РЈРґРѕР±РЅРѕРµ РїСЂРµРґСЃС‚Р°РІР»РµРЅРёРµ Р·Р°РїРёСЃРµР№ РґР»СЏ Р°РґРјРёРЅРєРё';

COMMIT;
