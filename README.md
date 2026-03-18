# EasyBooking

Telegram Mini App для записи на услуги салона.

## Что умеет MVP

- запись на услугу через Telegram Mini App
- выбор мастера, даты и времени
- напоминания за 24 часа и за 1 час
- запрос отзыва через 1 час после визита
- отмена записи
- админ-панель для просмотра записей, мастеров, услуг и отзывов

## Стек

- `bot`: Grammy + PostgreSQL
- `webapp`: React + Vite + TypeScript
- `database`: PostgreSQL
- `ui`: `@telegram-apps/telegram-ui`

## Структура

```text
EasyBooking/
├── bot/
├── webapp/
├── shared/
├── supabase/
└── README.md
```

## Запуск

1. Установить зависимости:

```powershell
bun install
cd bot; bun install
cd ../webapp; bun install
```

2. Заполнить `.env` файлы
3. Применить миграции Supabase

Запуск бота:

```powershell
cd bot
bun run dev
```

Запуск webapp:

```powershell
cd webapp
bun run dev
```

## Переменные окружения

Минимально нужны:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_ID`
- `POSTGRES_URL` или набор `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`
- `WEBAPP_URL`
- `TIMEZONE`

## Статус

Проект готов как MVP для тестирования и показа.
