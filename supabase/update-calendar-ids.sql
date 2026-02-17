-- Обновление Calendar ID для мастеров
-- Замените значения на реальные Calendar ID из Google Calendar

-- ИНСТРУКЦИЯ:
-- 1. Откройте Google Calendar (https://calendar.google.com/)
-- 2. Для каждого календаря мастера:
--    - Нажмите на три точки → Settings and sharing
--    - Скопируйте Calendar ID из раздела "Integrate calendar"
-- 3. Замените значения ниже на реальные Calendar ID
-- 4. Выполните этот скрипт

-- Анна Иванова
UPDATE masters
SET google_calendar_id = 'ЗАМЕНИТЕ_НА_CALENDAR_ID_АННЫ@group.calendar.google.com'
WHERE name = 'Анна Иванова';

-- Мария Петрова
UPDATE masters
SET google_calendar_id = 'ЗАМЕНИТЕ_НА_CALENDAR_ID_МАРИИ@group.calendar.google.com'
WHERE name = 'Мария Петрова';

-- Елена Сидорова
UPDATE masters
SET google_calendar_id = 'ЗАМЕНИТЕ_НА_CALENDAR_ID_ЕЛЕНЫ@group.calendar.google.com'
WHERE name = 'Елена Сидорова';

-- Проверка результата
SELECT 
  name as "Мастер",
  CASE 
    WHEN google_calendar_id IS NOT NULL AND google_calendar_id NOT LIKE 'ЗАМЕНИТЕ%' 
    THEN '✅ Настроен'
    ELSE '❌ Не настроен'
  END as "Статус",
  google_calendar_id as "Calendar ID"
FROM masters
ORDER BY name;

-- Если все настроено правильно, вы должны увидеть ✅ для всех мастеров
