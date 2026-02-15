-- Проверка прав доступа и состояния RLS

-- 1. Проверка RLS статуса
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Включен'
    ELSE '🔓 RLS Выключен'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('masters', 'services', 'master_services', 'master_schedules', 
                    'master_schedule_exceptions', 'bookings', 'reviews', 'admins')
ORDER BY tablename;

-- 2. Проверка существующих записей в bookings
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bookings,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
FROM bookings;

-- 3. Последние 5 записей
SELECT 
  id,
  client_name,
  booking_date,
  booking_time,
  status,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- 4. Проверка прав доступа для anon роли
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'bookings'
  AND grantee = 'anon';
