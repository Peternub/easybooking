# ⚡️ Быстрый старт за 10 минут

## 1️⃣ Установка Bun (1 мин)

```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Перезапустите терминал после установки.

## 2️⃣ Установка зависимостей (2 мин)

```powershell
bun install
```

## 3️⃣ Настройка Supabase (3 мин)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в SQL Editor
3. Выполните файлы:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

## 4️⃣ Создание Telegram бота (1 мин)

1. Напишите [@BotFather](https://t.me/BotFather)
2. Команда: `/newbot`
3. Сохраните токен

## 5️⃣ Переменные окружения (2 мин)

Создайте `.env`:

```env
TELEGRAM_BOT_TOKEN=ваш_токен
TELEGRAM_ADMIN_ID=ваш_telegram_id
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=ваш_ключ
SUPABASE_SERVICE_KEY=ваш_сервисный_ключ
WEBAPP_URL=http://localhost:3000
TIMEZONE=Europe/Moscow
NODE_ENV=development
```

Создайте `webapp/.env`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_ключ
```

## 6️⃣ Добавление администратора (30 сек)

В Supabase SQL Editor:

```sql
INSERT INTO admins (telegram_id, name)
VALUES (ваш_telegram_id, 'Ваше имя');
```

Узнать свой ID: [@userinfobot](https://t.me/userinfobot)

## 7️⃣ Тестовые данные (30 сек)

```sql
-- Мастер
INSERT INTO masters (name, description, specialization, google_calendar_id, is_active)
VALUES ('Анна Иванова', 'Опытный мастер', 'Парикмахер', 'primary', true)
RETURNING id;

-- Услуга
INSERT INTO services (name, price, duration_minutes, category, is_active)
VALUES ('Стрижка', 2000, 60, 'Парикмахерские услуги', true)
RETURNING id;

-- Связь (замените UUID)
INSERT INTO master_services (master_id, service_id)
VALUES ('master_id', 'service_id');

-- График (замените UUID)
INSERT INTO master_schedules (master_id, day_of_week, start_time, end_time, is_working)
SELECT 'master_id', day, '10:00', '19:00', true
FROM generate_series(0, 4) as day;
```

## 8️⃣ Запуск (1 мин)

Терминал 1:
```powershell
cd bot
bun run dev
```

Терминал 2:
```powershell
cd webapp
bun run dev
```

## 9️⃣ Тестирование

1. Откройте бота в Telegram
2. `/start`
3. "Записаться на услугу"
4. Пройдите процесс бронирования

## ✅ Готово!

Система работает локально. Для деплоя см. [docs/SETUP.md](./docs/SETUP.md)

## 🆘 Проблемы?

- **Бот не отвечает**: Проверьте токен в `.env`
- **Не загружаются данные**: Проверьте `webapp/.env`
- **Ошибки БД**: Проверьте миграции в Supabase

## 📚 Полная документация

- [Установка](./docs/INSTALLATION.md)
- [Настройка](./docs/SETUP.md)
- [Google Calendar](./docs/GOOGLE_CALENDAR.md)
- [README](./README.md)
