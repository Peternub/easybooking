# 🚀 Установка и первый запуск

## Шаг 1: Установка Bun

### Windows (PowerShell)

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

После установки перезапустите терминал.

Проверка установки:
```powershell
bun --version
```

## Шаг 2: Установка зависимостей проекта

```powershell
# В корне проекта
bun install
```

Это установит зависимости для всех workspace (bot, webapp, shared).

## Шаг 3: Настройка Supabase

### 3.1. Создание проекта

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Выберите регион (ближайший к Москве - Frankfurt)
4. Задайте пароль для базы данных
5. Дождитесь создания проекта (2-3 минуты)

### 3.2. Получение ключей

1. В панели проекта перейдите в Settings → API
2. Скопируйте:
   - Project URL
   - anon public key
   - service_role key (секретный!)

### 3.3. Применение миграций

Вариант 1 - Через Supabase Dashboard (рекомендуется):

1. Перейдите в SQL Editor
2. Создайте новый запрос
3. Скопируйте содержимое файла `supabase/migrations/001_initial_schema.sql`
4. Выполните запрос (Run)
5. Повторите для файла `supabase/migrations/002_rls_policies.sql`

Вариант 2 - Через Supabase CLI:

```powershell
# Установка CLI
bun install -g supabase

# Вход в аккаунт
supabase login

# Связывание проекта
supabase link --project-ref your-project-ref

# Применение миграций
supabase db push
```

### 3.4. Добавление первого администратора

В SQL Editor выполните:

```sql
INSERT INTO admins (telegram_id, name)
VALUES (YOUR_TELEGRAM_ID, 'Ваше имя');
```

Чтобы узнать свой Telegram ID:
- Напишите боту [@userinfobot](https://t.me/userinfobot)
- Или [@getmyid_bot](https://t.me/getmyid_bot)

## Шаг 4: Создание Telegram бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите название бота (например, "Салон Красоты Бронирование")
4. Введите username бота (должен заканчиваться на "bot", например, "beauty_booking_bot")
5. Сохраните токен бота (выглядит как `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Настройка меню бота:

```
/setmenubutton
Выберите вашего бота
Введите текст кнопки: Записаться
Введите URL: https://your-webapp-url.vercel.app
```

## Шаг 5: Настройка Google Calendar

См. подробную инструкцию в [GOOGLE_CALENDAR.md](./GOOGLE_CALENDAR.md)

Краткая версия:
1. Создайте проект в Google Cloud Console
2. Включите Google Calendar API
3. Создайте OAuth 2.0 credentials
4. Получите refresh token
5. Создайте календари для каждого мастера

## Шаг 6: Настройка переменных окружения

### 6.1. Файл `.env` в корне проекта

Создайте файл `.env`:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_ID=123456789

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar (опционально на первом этапе)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token

# App Settings
WEBAPP_URL=http://localhost:3000
TIMEZONE=Europe/Moscow
NODE_ENV=development
```

### 6.2. Файл `webapp/.env`

Создайте файл `webapp/.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Шаг 7: Добавление тестовых данных

В Supabase SQL Editor выполните:

```sql
-- Добавление мастера
INSERT INTO masters (name, photo_url, description, specialization, google_calendar_id, is_active)
VALUES (
  'Анна Иванова',
  'https://via.placeholder.com/150',
  'Опытный мастер с 5-летним стажем',
  'Парикмахер-стилист',
  'primary',
  true
) RETURNING id;

-- Сохраните ID мастера из результата

-- Добавление услуг
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES 
  ('Стрижка женская', 'Модельная стрижка с укладкой', 2000, 60, 'Парикмахерские услуги', true),
  ('Стрижка мужская', 'Классическая мужская стрижка', 1500, 45, 'Парикмахерские услуги', true),
  ('Окрашивание', 'Окрашивание волос', 3500, 120, 'Парикмахерские услуги', true),
  ('Маникюр', 'Классический маникюр с покрытием', 1800, 60, 'Маникюр', true),
  ('Педикюр', 'Классический педикюр с покрытием', 2200, 90, 'Педикюр', true);

-- Связь мастера со всеми услугами
INSERT INTO master_services (master_id, service_id)
SELECT 'MASTER_ID_HERE', id FROM services;

-- График работы (Пн-Пт, 10:00-19:00)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
VALUES
  ('MASTER_ID_HERE', 0, '10:00', '19:00', true),  -- Понедельник
  ('MASTER_ID_HERE', 1, '10:00', '19:00', true),  -- Вторник
  ('MASTER_ID_HERE', 2, '10:00', '19:00', true),  -- Среда
  ('MASTER_ID_HERE', 3, '10:00', '19:00', true),  -- Четверг
  ('MASTER_ID_HERE', 4, '10:00', '19:00', true),  -- Пятница
  ('MASTER_ID_HERE', 5, '10:00', '16:00', true),  -- Суббота
  ('MASTER_ID_HERE', 6, '00:00', '00:00', false); -- Воскресенье (выходной)
```

Замените `MASTER_ID_HERE` на реальный ID мастера из первого запроса.

## Шаг 8: Запуск в режиме разработки

### Терминал 1 - Запуск бота:

```powershell
cd bot
bun run dev
```

Вы должны увидеть:
```
🤖 Бот запускается в режиме разработки...
✅ Бот успешно запущен!
📱 Бот: @your_bot_username
📬 Запуск планировщика уведомлений...
```

### Терминал 2 - Запуск веб-приложения:

```powershell
cd webapp
bun run dev
```

Вы должны увидеть:
```
VITE v6.0.7  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## Шаг 9: Тестирование

1. Откройте Telegram
2. Найдите вашего бота по username
3. Отправьте команду `/start`
4. Нажмите кнопку "Записаться на услугу"
5. Пройдите процесс бронирования

## Проверка работы компонентов

### ✅ Бот работает:
- Отвечает на команду `/start`
- Показывает кнопки меню
- Логи в консоли без ошибок

### ✅ Web App работает:
- Открывается при нажатии кнопки
- Загружаются услуги
- Загружаются мастера
- Можно выбрать дату и время

### ✅ База данных работает:
- Данные загружаются в Web App
- Можно создать запись
- Запись сохраняется в Supabase

## Частые проблемы

### Бот не запускается

**Ошибка**: "Отсутствуют обязательные переменные окружения"
- Проверьте файл `.env`
- Убедитесь, что все переменные заполнены

**Ошибка**: "Unauthorized"
- Проверьте токен бота
- Убедитесь, что токен скопирован полностью

### Web App не открывается

**Ошибка**: "Failed to fetch"
- Проверьте файл `webapp/.env`
- Убедитесь, что Supabase URL и ключ правильные
- Проверьте консоль браузера (F12)

### Не загружаются данные

**Ошибка**: "Row Level Security"
- Проверьте, что применена миграция `002_rls_policies.sql`
- Временно можно отключить RLS для тестирования

### Google Calendar не работает

- На первом этапе можно работать без Google Calendar
- Система будет показывать все слоты как доступные
- Настройте Google Calendar позже по инструкции

## Следующие шаги

После успешного запуска:

1. ✅ Добавьте реальные данные мастеров
2. ✅ Настройте Google Calendar
3. ✅ Протестируйте полный цикл бронирования
4. ✅ Настройте деплой на Vercel (см. [SETUP.md](./SETUP.md))

## Полезные команды

```powershell
# Проверка кода
bun run lint

# Автоматическое исправление
bun run lint:fix

# Форматирование
bun run format

# Просмотр логов бота
cd bot
bun run dev

# Просмотр логов веб-приложения
cd webapp
bun run dev
```

## Получение помощи

Если что-то не работает:

1. Проверьте логи в консоли
2. Откройте консоль браузера (F12) для Web App
3. Проверьте переменные окружения
4. Убедитесь, что все миграции применены
5. Проверьте, что тестовые данные добавлены

Удачи! 🚀
