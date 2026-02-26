-- Удаление неиспользуемой таблицы master_schedule_exceptions
-- Эта таблица не используется в приложении, вместо нее используется master_absences

DROP TABLE IF EXISTS master_schedule_exceptions CASCADE;

-- Комментарий
COMMENT ON SCHEMA public IS 'Таблица master_schedule_exceptions удалена, используется master_absences для отпусков и больничных';
