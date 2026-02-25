-- Создание таблицы клиентов для CRM
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  username TEXT,
  phone TEXT,
  notes TEXT, -- Особенности клиента (аллергии, предпочтения и т.д.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_clients_telegram_id ON clients(telegram_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_phone ON clients(phone);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- RLS политики
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Clients are viewable by everyone"
  ON clients FOR SELECT
  USING (true);

-- Политика: все могут создавать
CREATE POLICY "Clients can be created by everyone"
  ON clients FOR INSERT
  WITH CHECK (true);

-- Политика: все могут обновлять
CREATE POLICY "Clients can be updated by everyone"
  ON clients FOR UPDATE
  USING (true);

-- Комментарии
COMMENT ON TABLE clients IS 'База клиентов салона';
COMMENT ON COLUMN clients.notes IS 'Заметки администратора об особенностях клиента';
