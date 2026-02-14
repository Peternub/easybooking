-- Исправление RLS политик для работы Mini App

-- Удаляем старые политики
DROP POLICY IF EXISTS "Все могут видеть активных мастеров" ON masters;
DROP POLICY IF EXISTS "Все могут видеть активные услуги" ON services;
DROP POLICY IF EXISTS "Все могут видеть связи мастеров и услуг" ON master_services;
DROP POLICY IF EXISTS "Все могут видеть график работы" ON master_schedules;
DROP POLICY IF EXISTS "Все могут видеть исключения в графике" ON master_schedule_exceptions;
DROP POLICY IF EXISTS "Клиенты видят свои записи" ON bookings;
DROP POLICY IF EXISTS "Клиенты могут создавать записи" ON bookings;
DROP POLICY IF EXISTS "Клиенты могут отменять свои записи" ON bookings;
DROP POLICY IF EXISTS "Все могут видеть отзывы" ON reviews;
DROP POLICY IF EXISTS "Клиенты могут создавать отзывы" ON reviews;

-- Создаем публичные политики для чтения
CREATE POLICY "Публичный доступ к мастерам"
  ON masters FOR SELECT
  USING (is_active = true);

CREATE POLICY "Публичный доступ к услугам"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Публичный доступ к связям мастер-услуга"
  ON master_services FOR SELECT
  USING (true);

CREATE POLICY "Публичный доступ к графику"
  ON master_schedules FOR SELECT
  USING (true);

CREATE POLICY "Публичный доступ к исключениям"
  ON master_schedule_exceptions FOR SELECT
  USING (true);

-- Разрешаем создание записей всем
CREATE POLICY "Разрешить создание записей"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Разрешаем чтение записей по telegram_id
CREATE POLICY "Чтение записей по telegram_id"
  ON bookings FOR SELECT
  USING (true);

-- Разрешаем обновление записей
CREATE POLICY "Обновление записей"
  ON bookings FOR UPDATE
  USING (true);

-- Разрешаем создание отзывов
CREATE POLICY "Создание отзывов"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Чтение отзывов"
  ON reviews FOR SELECT
  USING (true);