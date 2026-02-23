-- Обновление Calendar ID для мастеров

-- Анна Иванова
UPDATE masters
SET google_calendar_id = 'ef8690bdffff705a6fc798b44f68be4d1061bfce9c394ec7a0c920d7a719d9e@group.calendar.google.com'
WHERE name = 'Анна Иванова';

-- Мария Петрова
UPDATE masters
SET google_calendar_id = '3082d7cf85741604b17a970c0eefbb392049ac7aead36b5590385c79ab46923f@group.calendar.google.com'
WHERE name = 'Мария Петрова';

-- Елена Сидорова
UPDATE masters
SET google_calendar_id = '120cee979f0831d8bef38d76b0a4484318079bbed3bf132b103fa33609289665@group.calendar.google.com'
WHERE name = 'Елена Сидорова';

-- Проверка результата
SELECT 
  name as "Мастер",
  CASE 
    WHEN google_calendar_id IS NOT NULL AND google_calendar_id NOT LIKE '%ВСТАВЬ%' THEN '✅ Настроен'
    ELSE '❌ Не настроен'
  END as "Статус",
  google_calendar_id as "Calendar ID"
FROM masters
ORDER BY name;
