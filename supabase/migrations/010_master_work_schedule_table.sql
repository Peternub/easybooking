-- Создание отдельной таблицы для графика работы мастеров
-- Это более структурированный подход вместо JSONB

CREATE TABLE IF NOT EXISTS master_work_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_id UUID NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Проверка что время окончания > время начала
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  
  -- Уникальность: один мастер не может иметь пересекающиеся слоты в один день
  CONSTRAINT unique_master_day_time UNIQUE (master_id, day_of_week, start_time, end_time)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_master_work_schedule_master_id ON master_work_schedule(master_id);
CREATE INDEX idx_master_work_schedule_day ON master_work_schedule(day_of_week);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_master_work_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER master_work_schedule_updated_at
  BEFORE UPDATE ON master_work_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_master_work_schedule_updated_at();

-- RLS политики
ALTER TABLE master_work_schedule ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Master work schedule is viewable by everyone"
  ON master_work_schedule FOR SELECT
  USING (true);

-- Политика: все могут создавать
CREATE POLICY "Master work schedule can be created by everyone"
  ON master_work_schedule FOR INSERT
  WITH CHECK (true);

-- Политика: все могут обновлять
CREATE POLICY "Master work schedule can be updated by everyone"
  ON master_work_schedule FOR UPDATE
  USING (true);

-- Политика: все могут удалять
CREATE POLICY "Master work schedule can be deleted by everyone"
  ON master_work_schedule FOR DELETE
  USING (true);

-- Комментарии
COMMENT ON TABLE master_work_schedule IS 'График работы мастеров';
COMMENT ON COLUMN master_work_schedule.day_of_week IS 'День недели: 0 = Воскресенье, 1 = Понедельник, ..., 6 = Суббота';
COMMENT ON COLUMN master_work_schedule.start_time IS 'Время начала работы';
COMMENT ON COLUMN master_work_schedule.end_time IS 'Время окончания работы';

-- Миграция данных из JSONB в новую таблицу
-- Эта функция поможет перенести существующие данные
CREATE OR REPLACE FUNCTION migrate_work_schedule_to_table()
RETURNS void AS $$
DECLARE
  master_record RECORD;
  day_name TEXT;
  day_num INTEGER;
  time_slot TEXT;
  time_parts TEXT[];
BEGIN
  -- Перебираем всех мастеров
  FOR master_record IN SELECT id, work_schedule FROM masters WHERE work_schedule IS NOT NULL LOOP
    
    -- Перебираем дни недели
    FOR day_name, day_num IN 
      VALUES 
        ('sunday', 0),
        ('monday', 1),
        ('tuesday', 2),
        ('wednesday', 3),
        ('thursday', 4),
        ('friday', 5),
        ('saturday', 6)
    LOOP
      -- Проверяем есть ли расписание на этот день
      IF master_record.work_schedule ? day_name THEN
        -- Перебираем временные слоты для этого дня
        FOR time_slot IN 
          SELECT jsonb_array_elements_text(master_record.work_schedule->day_name)
        LOOP
          -- Парсим время вида "10:00-18:00"
          time_parts := string_to_array(time_slot, '-');
          
          IF array_length(time_parts, 1) = 2 THEN
            -- Вставляем в новую таблицу
            INSERT INTO master_work_schedule (master_id, day_of_week, start_time, end_time)
            VALUES (
              master_record.id,
              day_num,
              time_parts[1]::TIME,
              time_parts[2]::TIME
            )
            ON CONFLICT (master_id, day_of_week, start_time, end_time) DO NOTHING;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Запускаем миграцию данных
SELECT migrate_work_schedule_to_table();

-- Удаляем функцию миграции (больше не нужна)
DROP FUNCTION migrate_work_schedule_to_table();

-- ПРИМЕЧАНИЕ: Колонку work_schedule из таблицы masters можно будет удалить позже,
-- когда убедитесь что все работает с новой таблицей:
-- ALTER TABLE masters DROP COLUMN work_schedule;
