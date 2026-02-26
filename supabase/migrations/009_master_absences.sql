-- Таблица для отпусков и больничных мастеров

CREATE TABLE IF NOT EXISTS master_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('vacation', 'sick_leave', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Проверка что дата окончания >= дата начала
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_master_absences_master_id ON master_absences(master_id);
CREATE INDEX idx_master_absences_dates ON master_absences(start_date, end_date);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_master_absences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER master_absences_updated_at
  BEFORE UPDATE ON master_absences
  FOR EACH ROW
  EXECUTE FUNCTION update_master_absences_updated_at();

-- RLS политики
ALTER TABLE master_absences ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Master absences are viewable by everyone"
  ON master_absences FOR SELECT
  USING (true);

-- Политика: все могут создавать
CREATE POLICY "Master absences can be created by everyone"
  ON master_absences FOR INSERT
  WITH CHECK (true);

-- Политика: все могут обновлять
CREATE POLICY "Master absences can be updated by everyone"
  ON master_absences FOR UPDATE
  USING (true);

-- Политика: все могут удалять
CREATE POLICY "Master absences can be deleted by everyone"
  ON master_absences FOR DELETE
  USING (true);

-- Комментарии
COMMENT ON TABLE master_absences IS 'Отпуска и больничные мастеров';
COMMENT ON COLUMN master_absences.reason IS 'Причина отсутствия: vacation (отпуск), sick_leave (больничный), other (другое)';
COMMENT ON COLUMN master_absences.notes IS 'Дополнительные заметки';
