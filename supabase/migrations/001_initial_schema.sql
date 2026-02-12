-- Создание таблиц для системы бронирования

-- Таблица мастеров
CREATE TABLE masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  specialization TEXT,
  google_calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица услуг
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь мастеров и услуг (многие ко многим)
CREATE TABLE master_services (
  master_id UUID REFERENCES masters(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, service_id)
);

-- График работы мастеров
CREATE TABLE master_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN DEFAULT true,
  UNIQUE (master_id, day_of_week)
);

-- Исключения в графике (отпуска, выходные)
CREATE TABLE master_schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES masters(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (master_id, date)
);

-- Записи клиентов
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_telegram_id BIGINT NOT NULL,
  client_name TEXT NOT NULL,
  client_username TEXT,
  master_id UUID REFERENCES masters(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled_by_client', 'cancelled_by_admin')),
  cancellation_reason TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (master_id, booking_date, booking_time)
);

-- Отзывы
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  client_telegram_id BIGINT NOT NULL,
  master_id UUID REFERENCES masters(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Администраторы
CREATE TABLE admins (
  telegram_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_bookings_client ON bookings(client_telegram_id);
CREATE INDEX idx_bookings_master ON bookings(master_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_master ON reviews(master_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для bookings
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Комментарии к таблицам
COMMENT ON TABLE masters IS 'Справочник мастеров салона';
COMMENT ON TABLE services IS 'Каталог услуг';
COMMENT ON TABLE master_services IS 'Связь мастеров и услуг';
COMMENT ON TABLE master_schedules IS 'График работы мастеров';
COMMENT ON TABLE master_schedule_exceptions IS 'Исключения в графике (отпуска, выходные)';
COMMENT ON TABLE bookings IS 'Журнал записей клиентов';
COMMENT ON TABLE reviews IS 'Отзывы клиентов';
COMMENT ON TABLE admins IS 'Администраторы системы';
