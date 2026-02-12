-- Row Level Security (RLS) политики

-- Включаем RLS для всех таблиц
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Функция для проверки, является ли пользователь администратором
CREATE OR REPLACE FUNCTION is_admin(user_telegram_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admins WHERE telegram_id = user_telegram_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MASTERS: Все могут читать активных мастеров, только админы могут изменять
CREATE POLICY "Все могут видеть активных мастеров"
  ON masters FOR SELECT
  USING (is_active = true);

CREATE POLICY "Админы могут управлять мастерами"
  ON masters FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- SERVICES: Все могут читать активные услуги, только админы могут изменять
CREATE POLICY "Все могут видеть активные услуги"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Админы могут управлять услугами"
  ON services FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- MASTER_SERVICES: Все могут читать, только админы могут изменять
CREATE POLICY "Все могут видеть связи мастеров и услуг"
  ON master_services FOR SELECT
  USING (true);

CREATE POLICY "Админы могут управлять связями"
  ON master_services FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- MASTER_SCHEDULES: Все могут читать, только админы могут изменять
CREATE POLICY "Все могут видеть график работы"
  ON master_schedules FOR SELECT
  USING (true);

CREATE POLICY "Админы могут управлять графиком"
  ON master_schedules FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- MASTER_SCHEDULE_EXCEPTIONS: Все могут читать, только админы могут изменять
CREATE POLICY "Все могут видеть исключения в графике"
  ON master_schedule_exceptions FOR SELECT
  USING (true);

CREATE POLICY "Админы могут управлять исключениями"
  ON master_schedule_exceptions FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- BOOKINGS: Клиенты видят свои записи, админы видят все
CREATE POLICY "Клиенты видят свои записи"
  ON bookings FOR SELECT
  USING (
    client_telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT
    OR is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT)
  );

CREATE POLICY "Клиенты могут создавать записи"
  ON bookings FOR INSERT
  WITH CHECK (
    client_telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT
  );

CREATE POLICY "Клиенты могут отменять свои записи"
  ON bookings FOR UPDATE
  USING (
    client_telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT
    AND status = 'active'
  )
  WITH CHECK (
    status = 'cancelled_by_client'
  );

CREATE POLICY "Админы могут управлять всеми записями"
  ON bookings FOR ALL
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));

-- REVIEWS: Все могут читать, клиенты могут создавать свои отзывы
CREATE POLICY "Все могут видеть отзывы"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Клиенты могут создавать отзывы"
  ON reviews FOR INSERT
  WITH CHECK (
    client_telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT
  );

-- ADMINS: Только админы могут видеть список админов
CREATE POLICY "Админы видят список админов"
  ON admins FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::json->>'telegram_id')::BIGINT));
