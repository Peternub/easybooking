# 🗄️ Полная настройка Supabase с нуля

## Шаг 1: Создание проекта (если еще не создан)

1. Откройте [supabase.com](https://supabase.com)
2. Войдите в аккаунт или зарегистрируйтесь
3. Нажмите **New Project**
4. Заполните:
   - **Name:** EasyBooking (или любое название)
   - **Database Password:** Придумайте надежный пароль (сохраните его!)
   - **Region:** Europe West (Frankfurt) - ближайший к Москве
   - **Pricing Plan:** Free (для начала)
5. Нажмите **Create new project**
6. Подождите 2-3 минуты пока проект создается

## Шаг 2: Получение ключей доступа

1. В левом меню выберите **Settings** (⚙️)
2. Перейдите в **API**
3. Скопируйте и сохраните:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon public** ключ (начинается с `eyJhbGci...`)
   - **service_role** ключ (начинается с `eyJhbGci...`) - **СЕКРЕТНЫЙ!**

## Шаг 3: Создание структуры базы данных

1. В левом меню выберите **SQL Editor**
2. Нажмите **New query**
3. Скопируйте содержимое файла `supabase/migrations/001_initial_schema.sql`
4. Вставьте в редактор
5. Нажмите **Run** (или F5)
6. Должно появиться сообщение: "Success. No rows returned"

### Проверка создания таблиц:

1. В левом меню выберите **Table Editor**
2. Вы должны увидеть 8 таблиц:
   - ✅ masters
   - ✅ services
   - ✅ master_services
   - ✅ master_schedules
   - ✅ master_schedule_exceptions
   - ✅ bookings
   - ✅ reviews
   - ✅ admins

## Шаг 4: Настройка Row Level Security (RLS)

### Вариант A: Упрощенные политики (рекомендуется для начала)

1. В **SQL Editor** создайте новый запрос
2. Скопируйте содержимое файла `supabase/fix-rls.sql`
3. Вставьте и нажмите **Run**

Эти политики разрешают:
- ✅ Всем читать активных мастеров и услуги
- ✅ Всем создавать записи
- ✅ Всем читать и обновлять записи
- ✅ Всем создавать и читать отзывы

### Вариант B: Строгие политики (для продакшена)

1. В **SQL Editor** создайте новый запрос
2. Скопируйте содержимое файла `supabase/migrations/002_rls_policies.sql`
3. Вставьте и нажмите **Run**

Эти политики:
- ✅ Проверяют telegram_id пользователя
- ✅ Разграничивают права клиентов и администраторов
- ⚠️ Требуют настройки JWT claims (сложнее)

**Для быстрого старта используйте Вариант A!**

### Проверка RLS:

1. В **Table Editor** откройте любую таблицу (например, `masters`)
2. Справа вверху нажмите на иконку щита 🛡️
3. Вы должны увидеть список политик для этой таблицы

## Шаг 5: Добавление тестовых данных

1. В **SQL Editor** создайте новый запрос
2. Скопируйте содержимое файла `supabase/test-data.sql`
3. Вставьте и нажмите **Run**
4. В конце должна появиться таблица с результатами:
   ```
   Мастеров добавлено: 1
   Услуг добавлено: 5
   Связей мастер-услуга: 5
   Записей в графике: 7
   ```

### Проверка данных:

1. **Table Editor** → **masters** - должна быть Анна Иванова
2. **Table Editor** → **services** - должно быть 5 услуг
3. **Table Editor** → **master_services** - должно быть 5 связей
4. **Table Editor** → **master_schedules** - должно быть 7 записей (Пн-Вс)

## Шаг 6: Добавление администратора

1. Узнайте свой Telegram ID:
   - Напишите боту [@userinfobot](https://t.me/userinfobot)
   - Или [@getmyid_bot](https://t.me/getmyid_bot)
   - Скопируйте число (например: `123456789`)

2. В **SQL Editor** выполните:
   ```sql
   INSERT INTO admins (telegram_id, name)
   VALUES (ВАШ_TELEGRAM_ID, 'Ваше имя');
   ```
   
   Например:
   ```sql
   INSERT INTO admins (telegram_id, name)
   VALUES (123456789, 'Иван Петров');
   ```

3. Проверьте: **Table Editor** → **admins** - должна быть ваша запись

## Шаг 7: Обновление переменных окружения

### Файл `.env` (корень проекта):

```env
# Supabase
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_ANON_KEY=ваш_anon_ключ
SUPABASE_SERVICE_KEY=ваш_service_role_ключ
```

### Файл `bot/.env`:

```env
# Supabase
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_ANON_KEY=ваш_anon_ключ
SUPABASE_SERVICE_KEY=ваш_service_role_ключ

# Остальные переменные оставьте как есть
```

### Файл `webapp/.env`:

```env
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_ключ
```

## Шаг 8: Тестирование подключения

### Тест 1: Проверка через SQL Editor

Выполните запрос:
```sql
SELECT 
  (SELECT COUNT(*) FROM masters) as masters_count,
  (SELECT COUNT(*) FROM services) as services_count,
  (SELECT COUNT(*) FROM master_services) as connections_count,
  (SELECT COUNT(*) FROM master_schedules) as schedules_count,
  (SELECT COUNT(*) FROM admins) as admins_count;
```

Должно вернуть:
```
masters_count: 1
services_count: 5
connections_count: 5
schedules_count: 7
admins_count: 1
```

### Тест 2: Проверка через веб-приложение

1. Перезапустите веб-приложение:
   ```powershell
   cd webapp
   # Остановите текущий процесс (Ctrl+C)
   bun run dev
   ```

2. Откройте http://localhost:3000 в браузере
3. Откройте консоль (F12)
4. Должно появиться:
   ```
   ✅ Supabase инициализирован: https://ваш-проект.supabase.co
   ```

5. На странице должны загрузиться услуги

### Тест 3: Проверка через бота

1. Перезапустите бота:
   ```powershell
   cd bot
   # Остановите текущий процесс (Ctrl+C)
   bun run dev
   ```

2. В консоли должно появиться:
   ```
   🤖 Бот запускается в режиме разработки...
   ✅ Бот успешно запущен!
   ```

3. Откройте бота в Telegram
4. Отправьте `/start`
5. Нажмите кнопку "Записаться на услугу"
6. Должны загрузиться услуги

## Шаг 9: Проверка RLS политик

Если данные не загружаются, проверьте RLS:

1. **SQL Editor** → выполните:
   ```sql
   -- Проверка политик для masters
   SELECT * FROM pg_policies WHERE tablename = 'masters';
   
   -- Проверка политик для services
   SELECT * FROM pg_policies WHERE tablename = 'services';
   
   -- Проверка политик для bookings
   SELECT * FROM pg_policies WHERE tablename = 'bookings';
   ```

2. Если политик нет или они неправильные, выполните снова `supabase/fix-rls.sql`

## Шаг 10: Временное отключение RLS (для отладки)

Если ничего не помогает, временно отключите RLS:

```sql
-- ВНИМАНИЕ: Только для отладки! Не используйте на продакшене!
ALTER TABLE masters DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule_exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

После отладки включите обратно:

```sql
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

## Частые проблемы

### Проблема: "No rows returned" при запросе данных

**Решение:**
1. Проверьте что RLS политики созданы
2. Используйте упрощенные политики из `fix-rls.sql`
3. Временно отключите RLS для отладки

### Проблема: "Permission denied for table"

**Решение:**
1. Убедитесь что используете правильный ключ (anon для клиента, service_role для бота)
2. Проверьте RLS политики
3. Убедитесь что таблицы созданы

### Проблема: "Relation does not exist"

**Решение:**
1. Таблицы не созданы - выполните `001_initial_schema.sql`
2. Проверьте в Table Editor что все таблицы есть

### Проблема: Данные не загружаются в Mini App

**Решение:**
1. Откройте консоль браузера (F12)
2. Посмотрите ошибки
3. Проверьте что переменные окружения правильные
4. Перезапустите dev сервер

## Полезные команды SQL

### Просмотр всех мастеров с услугами:
```sql
SELECT 
  m.name as master,
  s.name as service,
  s.price,
  s.duration_minutes
FROM masters m
JOIN master_services ms ON m.id = ms.master_id
JOIN services s ON ms.service_id = s.id
WHERE m.is_active = true AND s.is_active = true
ORDER BY m.name, s.name;
```

### Просмотр графика работы:
```sql
SELECT 
  m.name as master,
  CASE ms.day_of_week
    WHEN 0 THEN 'Понедельник'
    WHEN 1 THEN 'Вторник'
    WHEN 2 THEN 'Среда'
    WHEN 3 THEN 'Четверг'
    WHEN 4 THEN 'Пятница'
    WHEN 5 THEN 'Суббота'
    WHEN 6 THEN 'Воскресенье'
  END as day,
  ms.start_time,
  ms.end_time,
  ms.is_working
FROM master_schedules ms
JOIN masters m ON ms.master_id = m.id
ORDER BY m.name, ms.day_of_week;
```

### Просмотр всех записей:
```sql
SELECT 
  b.booking_date,
  b.booking_time,
  b.client_name,
  m.name as master,
  s.name as service,
  b.status
FROM bookings b
JOIN masters m ON b.master_id = m.id
JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

## Следующие шаги

После успешной настройки Supabase:

1. ✅ Протестируйте создание записи через Mini App
2. ✅ Проверьте что запись появилась в Table Editor
3. ✅ Настройте Google Calendar (опционально)
4. ✅ Задеплойте на Vercel
5. ✅ Настройте переменные окружения на Vercel

## Поддержка

Если что-то не работает:
1. Проверьте логи в консоли браузера
2. Проверьте логи бота в терминале
3. Проверьте данные в Supabase Table Editor
4. Выполните тестовые SQL запросы выше
5. Отправьте скриншоты ошибок для помощи
