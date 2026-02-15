# 🆕 Создание нового проекта Supabase с нуля

## Шаг 1: Удаление старого проекта (опционально)

1. Откройте [supabase.com](https://supabase.com)
2. Войдите в аккаунт
3. Выберите старый проект
4. Settings → General → внизу страницы "Delete Project"
5. Введите название проекта для подтверждения
6. Нажмите Delete

## Шаг 2: Создание нового проекта

1. На главной странице Supabase нажмите **New Project**
2. Заполните:
   - **Name:** `EasyBooking` (или любое название)
   - **Database Password:** Придумайте надежный пароль и **СОХРАНИТЕ ЕГО!**
   - **Region:** `Europe West (Frankfurt)` - ближайший к Москве
   - **Pricing Plan:** `Free`
3. Нажмите **Create new project**
4. Подождите 2-3 минуты пока проект создается ☕

## Шаг 3: Получение ключей

1. После создания проекта перейдите в **Settings** (⚙️) → **API**
2. Скопируйте и сохраните:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon public** ключ (длинная строка начинающаяся с `eyJhbGci...`)
   - **service_role** ключ (еще одна длинная строка) - **СЕКРЕТНЫЙ!**

## Шаг 4: Создание структуры базы данных

1. В левом меню выберите **SQL Editor**
2. Нажмите **New query**
3. Скопируйте **ВЕСЬ** файл `supabase/migrations/001_initial_schema.sql`
4. Вставьте в редактор
5. Нажмите **Run** (или F5)
6. Должно появиться: "Success. No rows returned"

### Проверка:
- Перейдите в **Table Editor**
- Должны быть 8 таблиц: masters, services, master_services, master_schedules, master_schedule_exceptions, bookings, reviews, admins

## Шаг 5: Отключение RLS (для упрощения)

1. В **SQL Editor** создайте новый запрос
2. Скопируйте файл `supabase/disable-rls-temp.sql`
3. Выполните
4. Должно появиться: "✅ RLS ОТКЛЮЧЕН ДЛЯ ВСЕХ ТАБЛИЦ"

**Почему отключаем RLS?**
- Упрощает отладку
- Не нужно настраивать сложные политики
- Для MVP и разработки это нормально
- Позже можно включить для продакшена

## Шаг 6: Добавление тестовых данных

1. В **SQL Editor** создайте новый запрос
2. Скопируйте **ВЕСЬ** файл `supabase/test-data.sql`
3. Выполните
4. Должно появиться:
   ```
   Мастеров добавлено: 1
   Услуг добавлено: 5
   Связей мастер-услуга: 5
   Записей в графике: 7
   ```

### Проверка:
Выполните:
```sql
SELECT * FROM masters;
SELECT * FROM services;
```
Должны увидеть Анну Иванову и 5 услуг.

## Шаг 7: Добавление себя как администратора

1. Узнайте свой Telegram ID:
   - Напишите боту [@userinfobot](https://t.me/userinfobot)
   - Скопируйте число (например: `123456789`)

2. В **SQL Editor** выполните (замените на свой ID):
   ```sql
   INSERT INTO admins (telegram_id, name)
   VALUES (123456789, 'Ваше имя');
   ```

### Проверка:
```sql
SELECT * FROM admins;
```
Должна быть ваша запись.

## Шаг 8: Обновление переменных окружения

### Файл `.env` (корень проекта):
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_ADMIN_ID=ваш_telegram_id

# Supabase (НОВЫЕ КЛЮЧИ!)
SUPABASE_URL=https://ваш-новый-проект.supabase.co
SUPABASE_ANON_KEY=новый_anon_ключ
SUPABASE_SERVICE_KEY=новый_service_role_ключ

# Google Calendar (оставьте как есть)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GOOGLE_REFRESH_TOKEN=...

# App Settings
WEBAPP_URL=http://localhost:3000
TIMEZONE=Europe/Moscow
NODE_ENV=development
```

### Файл `bot/.env`:
```env
# Скопируйте все из корневого .env
```

### Файл `webapp/.env`:
```env
VITE_SUPABASE_URL=https://ваш-новый-проект.supabase.co
VITE_SUPABASE_ANON_KEY=новый_anon_ключ
```

## Шаг 9: Финальная проверка

В **SQL Editor** выполните:
```sql
-- Проверка данных
SELECT 
  (SELECT COUNT(*) FROM masters) as masters,
  (SELECT COUNT(*) FROM services) as services,
  (SELECT COUNT(*) FROM master_services) as connections,
  (SELECT COUNT(*) FROM master_schedules) as schedules,
  (SELECT COUNT(*) FROM admins) as admins;

-- Проверка RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '🔒 Включен' ELSE '🔓 Выключен' END as rls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'masters';
```

Должно быть:
- masters: 1
- services: 5
- connections: 5
- schedules: 7
- admins: 1
- RLS: 🔓 Выключен

## Шаг 10: Перезапуск приложений

```powershell
# Терминал 1 - Бот
cd bot
# Остановите старый процесс (Ctrl+C)
bun run dev

# Терминал 2 - Веб-приложение
cd webapp
# Остановите старый процесс (Ctrl+C)
bun run dev
```

В консоли бота должно появиться:
```
🤖 Бот запускается в режиме разработки...
✅ Бот успешно запущен!
```

В консоли веб-приложения:
```
VITE v6.0.7  ready in 500 ms
➜  Local:   http://localhost:3000/
```

## Шаг 11: Тестирование

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Нажмите "Записаться на услугу"
4. Должны загрузиться 5 услуг
5. Выберите услугу → мастера → дату → время
6. Нажмите "Записаться"
7. Откройте консоль браузера (F12) - должны быть логи
8. В консоли бота должны появиться логи создания записи
9. В Telegram должно прийти подтверждение

## Проверка в Supabase

После создания записи:
1. Откройте **Table Editor** → **bookings**
2. Должна появиться новая запись
3. Проверьте все поля: дата, время, клиент, мастер, услуга, статус

## Если что-то не работает

### Услуги не загружаются:
- Откройте консоль браузера (F12)
- Проверьте ошибки
- Убедитесь что переменные окружения правильные
- Перезапустите dev сервер

### Кнопка "Записаться" не работает:
- Откройте консоль браузера
- Должны быть логи "=== ОТПРАВКА ДАННЫХ ==="
- Проверьте что бот запущен
- Проверьте логи бота

### Бот не получает данные:
- Убедитесь что Mini App открыт через кнопку в боте
- Проверьте что бот запущен
- Посмотрите логи бота

## Готово! 🎉

Теперь у вас чистый проект Supabase с:
- ✅ Правильной структурой базы данных
- ✅ Отключенным RLS (для упрощения)
- ✅ Тестовыми данными
- ✅ Вашим аккаунтом администратора
- ✅ Обновленными переменными окружения

Можно тестировать создание записей!

## Важно для продакшена

Когда будете деплоить на Vercel:
1. Обновите переменные окружения на Vercel (новые ключи Supabase)
2. Рассмотрите включение RLS для безопасности
3. Настройте Google Calendar для синхронизации
