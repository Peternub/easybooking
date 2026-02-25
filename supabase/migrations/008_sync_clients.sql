-- Автоматическая синхронизация клиентов из записей

-- Функция для автоматического создания/обновления клиента при создании записи
CREATE OR REPLACE FUNCTION sync_client_from_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Проверяем, есть ли клиент с таким telegram_id
  IF NEW.client_telegram_id IS NOT NULL THEN
    SELECT id INTO v_client_id
    FROM clients
    WHERE telegram_id = NEW.client_telegram_id;
    
    -- Если клиента нет, создаем
    IF v_client_id IS NULL THEN
      INSERT INTO clients (telegram_id, name, username)
      VALUES (NEW.client_telegram_id, NEW.client_name, NEW.client_username)
      RETURNING id INTO v_client_id;
    ELSE
      -- Если клиент есть, обновляем его данные
      UPDATE clients
      SET 
        name = COALESCE(NEW.client_name, name),
        username = COALESCE(NEW.client_username, username),
        updated_at = NOW()
      WHERE id = v_client_id;
    END IF;
    
    -- Привязываем запись к клиенту
    NEW.client_id = v_client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматической синхронизации
DROP TRIGGER IF EXISTS sync_client_on_booking ON bookings;
CREATE TRIGGER sync_client_on_booking
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_from_booking();

-- Миграция существующих данных: создаем клиентов из существующих записей
INSERT INTO clients (telegram_id, name, username)
SELECT DISTINCT 
  client_telegram_id,
  client_name,
  client_username
FROM bookings
WHERE client_telegram_id IS NOT NULL
ON CONFLICT (telegram_id) DO NOTHING;

-- Обновляем существующие записи, привязывая их к клиентам
UPDATE bookings b
SET client_id = c.id
FROM clients c
WHERE b.client_telegram_id = c.telegram_id
  AND b.client_id IS NULL;

COMMENT ON FUNCTION sync_client_from_booking IS 'Автоматически создает или обновляет клиента при создании записи';
