-- Скрипт для применения всех миграций для админ панели
-- Выполните этот файл в Supabase SQL Editor

-- Миграция 006: Таблица клиентов
\i 006_clients_table.sql

-- Миграция 007: Расширения для админки
\i 007_admin_enhancements.sql

-- Миграция 008: Синхронизация клиентов
\i 008_sync_clients.sql

-- Проверка результатов
SELECT 'Миграции успешно применены!' as status;

-- Проверка таблиц
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'masters', 'services', 'bookings')
ORDER BY table_name;

-- Проверка новых колонок
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'masters' 
  AND column_name IN ('work_schedule', 'phone');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('source', 'client_id', 'admin_notes');
