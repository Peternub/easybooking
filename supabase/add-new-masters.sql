-- Добавление двух новых мастеров к существующим данным

-- 1. Добавление новых мастеров
INSERT INTO masters (name, photo_url, description, specialization, google_calendar_id, is_active)
VALUES 
  (
    'Мария Петрова',
    'https://i.pravatar.cc/150?img=9',
    'Специалист по окрашиванию и сложным укладкам',
    'Колорист',
    null,
    true
  ),
  (
    'Елена Сидорова',
    'https://i.pravatar.cc/150?img=10',
    'Мастер маникюра и педикюра с 7-летним опытом',
    'Nail-мастер',
    null,
    true
  );

-- 2. Связь Марии Петровой с парикмахерскими услугами
INSERT INTO master_services (master_id, service_id)
SELECT m.id, s.id
FROM masters m
CROSS JOIN services s
WHERE m.name = 'Мария Петрова'
  AND s.category = 'Парикмахерские услуги';

-- 3. Связь Елены Сидоровой с маникюром и педикюром
INSERT INTO master_services (master_id, service_id)
SELECT m.id, s.id
FROM masters m
CROSS JOIN services s
WHERE m.name = 'Елена Сидорова'
  AND s.category IN ('Маникюр', 'Педикюр');

-- 4. График работы Марии Петровой (Пн-Пт: 10:00-19:00, Сб: 10:00-16:00, Вс: выходной)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, 0, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 1, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 2, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 3, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 4, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 5, '10:00:00'::time, '16:00:00'::time, true FROM masters m WHERE m.name = 'Мария Петрова'
UNION ALL
SELECT m.id, 6, '00:00:00'::time, '00:00:00'::time, false FROM masters m WHERE m.name = 'Мария Петрова';

-- 5. График работы Елены Сидоровой (Пн-Пт: 10:00-19:00, Сб: 10:00-16:00, Вс: выходной)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, 0, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 1, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 2, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 3, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 4, '10:00:00'::time, '19:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 5, '10:00:00'::time, '16:00:00'::time, true FROM masters m WHERE m.name = 'Елена Сидорова'
UNION ALL
SELECT m.id, 6, '00:00:00'::time, '00:00:00'::time, false FROM masters m WHERE m.name = 'Елена Сидорова';

-- Проверка результата
SELECT 
  m.name as "Мастер",
  m.specialization as "Специализация",
  COUNT(DISTINCT ms.service_id) as "Количество услуг",
  COUNT(DISTINCT msch.id) as "Дней в графике"
FROM masters m
LEFT JOIN master_services ms ON m.id = ms.master_id
LEFT JOIN master_schedules msch ON m.id = msch.master_id
GROUP BY m.id, m.name, m.specialization
ORDER BY m.name;

SELECT '✅ Новые мастера добавлены!' as status;
