-- 🔍 Диагностика Supabase
-- Скопируйте весь этот файл и выполните в Supabase SQL Editor
-- Это покажет текущее состояние базы данных

-- ============================================================================
-- 1. ПРОВЕРКА ТАБЛИЦ
-- ============================================================================

SELECT '=== ПРОВЕРКА ТАБЛИЦ ===' as step;

SELECT 
  'masters' as table_name,
  COUNT(*) as rows_count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM masters
UNION ALL
SELECT 'services', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM services
UNION ALL
SELECT 'master_services', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM master_services
UNION ALL
SELECT 'master_schedules', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM master_schedules
UNION ALL
SELECT 'master_schedule_exceptions', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM master_schedule_exceptions
UNION ALL
SELECT 'bookings', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ (есть записи)' ELSE 'ℹ️ (пусто)' END FROM bookings
UNION ALL
SELECT 'reviews', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ (есть отзывы)' ELSE 'ℹ️ (пусто)' END FROM reviews
UNION ALL
SELECT 'admins', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END FROM admins;

-- ============================================================================
-- 2. ПРОВЕРКА RLS ПОЛИТИК
-- ============================================================================

SELECT '=== ПРОВЕРКА RLS ПОЛИТИК ===' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN '📖 SELECT'
    WHEN cmd = 'INSERT' THEN '➕ INSERT'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    WHEN cmd = '*' THEN '🌟 ALL'
    ELSE cmd
  END as command,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Разрешающая'
    ELSE '⛔ Ограничивающая'
  END as type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================================================
-- 3. ПРОВЕРКА RLS ВКЛЮЧЕН/ВЫКЛЮЧЕН
-- ============================================================================

SELECT '=== СТАТУС RLS ===' as step;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 Включен'
    ELSE '🔓 Выключен'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('masters', 'services', 'master_services', 'master_schedules', 
                    'master_schedule_exceptions', 'bookings', 'reviews', 'admins')
ORDER BY tablename;

-- ============================================================================
-- 4. ДЕТАЛИ МАСТЕРОВ
-- ============================================================================

SELECT '=== МАСТЕРА ===' as step;

SELECT 
  id,
  name,
  specialization,
  google_calendar_id,
  CASE WHEN is_active THEN '✅ Активен' ELSE '❌ Неактивен' END as status,
  (SELECT COUNT(*) FROM master_services WHERE master_id = m.id) as services_count,
  (SELECT COUNT(*) FROM master_schedules WHERE master_id = m.id) as schedule_days,
  (SELECT COUNT(*) FROM bookings WHERE master_id = m.id) as bookings_count
FROM masters m
ORDER BY name;

-- ============================================================================
-- 5. ДЕТАЛИ УСЛУГ
-- ============================================================================

SELECT '=== УСЛУГИ ===' as step;

SELECT 
  id,
  name,
  category,
  price || ' ₽' as price,
  duration_minutes || ' мин' as duration,
  CASE WHEN is_active THEN '✅ Активна' ELSE '❌ Неактивна' END as status,
  (SELECT COUNT(*) FROM master_services WHERE service_id = s.id) as masters_count,
  (SELECT COUNT(*) FROM bookings WHERE service_id = s.id) as bookings_count
FROM services s
ORDER BY category, name;

-- ============================================================================
-- 6. ГРАФИК РАБОТЫ
-- ============================================================================

SELECT '=== ГРАФИК РАБОТЫ ===' as step;

SELECT 
  m.name as master,
  CASE ms.day_of_week
    WHEN 0 THEN '1️⃣ Понедельник'
    WHEN 1 THEN '2️⃣ Вторник'
    WHEN 2 THEN '3️⃣ Среда'
    WHEN 3 THEN '4️⃣ Четверг'
    WHEN 4 THEN '5️⃣ Пятница'
    WHEN 5 THEN '6️⃣ Суббота'
    WHEN 6 THEN '7️⃣ Воскресенье'
  END as day,
  CASE 
    WHEN ms.is_working THEN ms.start_time::text || ' - ' || ms.end_time::text
    ELSE '❌ Выходной'
  END as hours
FROM master_schedules ms
JOIN masters m ON ms.master_id = m.id
ORDER BY m.name, ms.day_of_week;

-- ============================================================================
-- 7. АДМИНИСТРАТОРЫ
-- ============================================================================

SELECT '=== АДМИНИСТРАТОРЫ ===' as step;

SELECT 
  telegram_id,
  name,
  added_at,
  '✅ Активен' as status
FROM admins
ORDER BY added_at;

-- ============================================================================
-- 8. ПОСЛЕДНИЕ ЗАПИСИ
-- ============================================================================

SELECT '=== ПОСЛЕДНИЕ ЗАПИСИ ===' as step;

SELECT 
  b.booking_date,
  b.booking_time,
  b.client_name,
  m.name as master,
  s.name as service,
  CASE b.status
    WHEN 'active' THEN '✅ Активна'
    WHEN 'completed' THEN '✔️ Завершена'
    WHEN 'cancelled_by_client' THEN '❌ Отменена клиентом'
    WHEN 'cancelled_by_admin' THEN '⛔ Отменена админом'
    ELSE b.status
  END as status,
  b.created_at
FROM bookings b
JOIN masters m ON b.master_id = m.id
JOIN services s ON b.service_id = s.id
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================================================
-- 9. ПРОВЕРКА СВЯЗЕЙ
-- ============================================================================

SELECT '=== СВЯЗИ МАСТЕР-УСЛУГА ===' as step;

SELECT 
  m.name as master,
  s.name as service,
  s.price || ' ₽' as price,
  s.duration_minutes || ' мин' as duration
FROM master_services ms
JOIN masters m ON ms.master_id = m.id
JOIN services s ON ms.service_id = s.id
WHERE m.is_active = true AND s.is_active = true
ORDER BY m.name, s.name;

-- ============================================================================
-- 10. ИТОГОВАЯ СТАТИСТИКА
-- ============================================================================

SELECT '=== ИТОГОВАЯ СТАТИСТИКА ===' as step;

SELECT 
  '👥 Мастеров' as metric,
  COUNT(*)::text as value
FROM masters WHERE is_active = true
UNION ALL
SELECT '💇 Услуг', COUNT(*)::text FROM services WHERE is_active = true
UNION ALL
SELECT '🔗 Связей мастер-услуга', COUNT(*)::text FROM master_services
UNION ALL
SELECT '📅 Записей в графике', COUNT(*)::text FROM master_schedules
UNION ALL
SELECT '📝 Всего записей', COUNT(*)::text FROM bookings
UNION ALL
SELECT '✅ Активных записей', COUNT(*)::text FROM bookings WHERE status = 'active'
UNION ALL
SELECT '⭐ Отзывов', COUNT(*)::text FROM reviews
UNION ALL
SELECT '👨‍💼 Администраторов', COUNT(*)::text FROM admins;

-- ============================================================================
-- 11. ПРОВЕРКА ИНДЕКСОВ
-- ============================================================================

SELECT '=== ИНДЕКСЫ ===' as step;

SELECT 
  tablename,
  indexname,
  '✅ Создан' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'reviews')
ORDER BY tablename, indexname;

-- ============================================================================
-- ГОТОВО!
-- ============================================================================

SELECT '=== ✅ ДИАГНОСТИКА ЗАВЕРШЕНА ===' as step;

SELECT 
  'Если все таблицы показывают ✅ - база данных настроена правильно!' as message
UNION ALL
SELECT 'Если есть ❌ - выполните соответствующие миграции из папки supabase/migrations/'
UNION ALL
SELECT 'Если RLS выключен (🔓) - выполните supabase/fix-rls.sql для включения политик'
UNION ALL
SELECT 'Если нет данных - выполните supabase/test-data.sql для добавления тестовых данных';
