-- 🔄 ПОЛНЫЙ СБРОС RLS ПОЛИТИК
-- Выполните этот файл ПЕРВЫМ, затем quick-fix-all.sql

-- ============================================================================
-- УДАЛЕНИЕ ВСЕХ ПОЛИТИК
-- ============================================================================

-- Удаляем ВСЕ политики для masters
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'masters' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON masters';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для services
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'services' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON services';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для master_services
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'master_services' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON master_services';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для master_schedules
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'master_schedules' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON master_schedules';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для master_schedule_exceptions
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'master_schedule_exceptions' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON master_schedule_exceptions';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для bookings
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'bookings' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON bookings';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для reviews
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reviews' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON reviews';
    END LOOP;
END $$;

-- Удаляем ВСЕ политики для admins
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admins' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON admins';
    END LOOP;
END $$;

-- ============================================================================
-- ПРОВЕРКА
-- ============================================================================

SELECT '=== ✅ ВСЕ ПОЛИТИКИ УДАЛЕНЫ ===' as status;

SELECT 
  tablename,
  COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('masters', 'services', 'master_services', 'master_schedules', 
                    'master_schedule_exceptions', 'bookings', 'reviews', 'admins')
GROUP BY tablename
UNION ALL
SELECT 'ИТОГО', COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('masters', 'services', 'master_services', 'master_schedules', 
                    'master_schedule_exceptions', 'bookings', 'reviews', 'admins');

SELECT 'Если ИТОГО = 0, значит все политики удалены успешно!' as message;
SELECT 'Теперь выполните supabase/quick-fix-all.sql для создания новых политик' as next_step;
