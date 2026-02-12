# Инструкция по настройке проекта

## 1. Установка зависимостей

```powershell
# Установка bun (если еще не установлен)
# Скачайте с https://bun.sh/

# Установка зависимостей
bun install
```

## 2. Настройка Supabase

### 2.1. Создание проекта

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Сохраните URL проекта и API ключи

### 2.2. Применение миграций

1. Установите Supabase CLI:
```powershell
bun install -g supabase
```

2. Войдите в аккаунт:
```powershell
supabase login
```

3. Свяжите проект:
```powershell
supabase link --project-ref your-project-ref
```

4. Примените миграции:
```powershell
supabase db push
```

Или выполните SQL файлы вручную через Supabase Dashboard:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`

### 2.3. Добавление первого администратора

Выполните в SQL Editor:

```sql
INSERT INTO admins (telegram_id, name)
VALUES (YOUR_TELEGRAM_ID, 'Ваше имя');
```

Чтобы узнать свой Telegram ID, напишите боту [@userinfobot](https://t.me/userinfobot)

## 3. Создание Telegram бота

1. Напишите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям
4. Сохраните токен бота
5. Настройте Web App:
   - `/setmenubutton` - добавьте кнопку меню с вашим Web App URL

## 4. Настройка Google Calendar API

См. [GOOGLE_CALENDAR.md](./GOOGLE_CALENDAR.md)

## 5. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_ID=your_telegram_id

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token

# App Settings
WEBAPP_URL=http://localhost:3000
TIMEZONE=Europe/Moscow
```

Создайте файл `webapp/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 6. Запуск в режиме разработки

### Запуск бота:
```powershell
cd bot
bun run dev
```

### Запуск веб-приложения:
```powershell
cd webapp
bun run dev
```

## 7. Деплой на Vercel

### 7.1. Деплой веб-приложения

```powershell
cd webapp
vercel
```

Следуйте инструкциям Vercel CLI.

### 7.2. Деплой бота

1. Создайте файл `vercel.json` в папке `bot`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

2. Деплой:
```powershell
cd bot
vercel
```

3. Настройте webhook:
```powershell
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-bot.vercel.app"
```

### 7.3. Настройка переменных окружения в Vercel

В настройках проекта на Vercel добавьте все переменные из `.env`

## 8. Добавление тестовых данных

Выполните в Supabase SQL Editor:

```sql
-- Добавление мастера
INSERT INTO masters (name, photo_url, description, specialization, google_calendar_id, is_active)
VALUES (
  'Анна Иванова',
  'https://example.com/photo.jpg',
  'Опытный мастер с 5-летним стажем',
  'Парикмахер-стилист',
  'your_calendar_id@group.calendar.google.com',
  true
);

-- Добавление услуги
INSERT INTO services (name, description, price, duration_minutes, category, is_active)
VALUES (
  'Стрижка женская',
  'Модельная стрижка с укладкой',
  2000,
  60,
  'Парикмахерские услуги',
  true
);

-- Связь мастера и услуги
INSERT INTO master_services (master_id, service_id)
SELECT m.id, s.id
FROM masters m, services s
WHERE m.name = 'Анна Иванова' AND s.name = 'Стрижка женская';

-- График работы (Пн-Пт, 10:00-18:00)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT m.id, day, '10:00', '18:00', true
FROM masters m, generate_series(0, 4) as day
WHERE m.name = 'Анна Иванова';
```

## 9. Проверка работы

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Нажмите "Записаться на услугу"
4. Пройдите процесс бронирования

## Troubleshooting

### Бот не отвечает
- Проверьте токен бота
- Убедитесь, что бот запущен
- Проверьте логи

### Не загружаются данные в Web App
- Проверьте переменные окружения
- Откройте консоль браузера для ошибок
- Проверьте RLS политики в Supabase

### Ошибки Google Calendar
- Проверьте credentials
- Убедитесь, что refresh token действителен
- Проверьте права доступа к календарю
