-- ⚠️ ВРЕМЕННОЕ ОТКЛЮЧЕНИЕ RLS
-- Это позволит приложению работать без ограничений
-- ВНИМАНИЕ: Используйте только для отладки!

-- Отключаем RLS для всех таблиц
ALTER TABLE masters DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule_exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Проверка
SELECT '=== ✅ RLS ОТКЛЮЧЕН ДЛЯ ВСЕХ ТАБЛИЦ ===' as status;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 Включен (не должно быть!)'
    ELSE '🔓 Выключен (правильно!)'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('masters', 'services', 'master_services', 'master_schedules', 
                    'master_schedule_exceptions', 'bookings', 'reviews', 'admins')
ORDER BY tablename;

SELECT 'Теперь приложение должно работать!' as message;
SELECT 'После отладки включите RLS обратно для безопасности' as warning;
