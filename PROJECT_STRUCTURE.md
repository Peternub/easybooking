# 📁 Структура проекта EasyBooking

## Основные файлы

```
EasyBooking/
├── 📚 SETUP_GUIDE.md          # Полная инструкция по настройке (ГЛАВНЫЙ ФАЙЛ!)
├── 📖 README.md               # Описание проекта
├── 📋 PROJECT_STRUCTURE.md    # Этот файл
├── .env                       # Переменные окружения (корень)
├── .env.example               # Пример переменных окружения
├── .gitignore                 # Игнорируемые файлы
├── biome.json                 # Конфигурация линтера
├── package.json               # Зависимости (корень)
└── bun.lock                   # Lock файл зависимостей
```

## Bot (Telegram бот)

```
bot/
├── src/
│   ├── handlers/              # Обработчики команд бота
│   │   ├── start.ts          # Команда /start
│   │   ├── bookings.ts       # Просмотр записей
│   │   ├── cancel.ts         # Отмена записи
│   │   ├── webapp.ts         # Обработка данных из Mini App
│   │   └── index.ts          # Экспорт всех handlers
│   ├── services/              # Бизнес-логика
│   │   ├── supabase.ts       # Работа с БД
│   │   └── google-calendar.ts # Работа с Google Calendar
│   ├── notifications/         # Система уведомлений
│   │   ├── scheduler.ts      # Планировщик напоминаний
│   │   └── reminders.ts      # Отправка напоминаний
│   ├── api/                   # API endpoints
│   │   └── notify-booking.ts # Endpoint для уведомлений о записи
│   ├── utils/                 # Утилиты
│   │   └── notify-admin.ts   # Уведомления админу
│   ├── config.ts              # Конфигурация бота
│   └── index.ts               # Точка входа
├── google-service-account.json # Google Service Account ключ (НЕ КОММИТИТЬ!)
├── .env                       # Переменные окружения (НЕ КОММИТИТЬ!)
├── .env.example               # Пример переменных
├── package.json               # Зависимости бота
└── tsconfig.json              # TypeScript конфиг
```

## WebApp (Mini App)

```
webapp/
├── src/
│   ├── components/            # React компоненты
│   │   ├── SelectService.tsx # Выбор услуги
│   │   ├── SelectMaster.tsx  # Выбор мастера
│   │   ├── SelectDateTime.tsx # Выбор даты/времени
│   │   └── BookingConfirmation.tsx # Подтверждение записи
│   ├── pages/                 # Страницы
│   │   ├── BookingFlow.tsx   # Процесс записи
│   │   ├── AdminPanel.tsx    # Админ панель
│   │   └── ReviewPage.tsx    # Страница отзыва
│   ├── services/              # API клиенты
│   │   └── supabase.ts       # Supabase клиент
│   ├── hooks/                 # Custom hooks
│   │   └── useTelegramTheme.ts # Тема Telegram
│   ├── types/                 # TypeScript типы
│   │   └── telegram.d.ts     # Типы Telegram WebApp
│   ├── App.tsx                # Главный компонент
│   ├── main.tsx               # Точка входа
│   ├── index.css              # Глобальные стили
│   └── vite-env.d.ts          # Vite типы
├── .env                       # Переменные окружения (НЕ КОММИТИТЬ!)
├── .env.example               # Пример переменных
├── .env.local                 # Локальные переменные
├── index.html                 # HTML шаблон
├── package.json               # Зависимости webapp
├── tsconfig.json              # TypeScript конфиг
├── vite.config.ts             # Vite конфиг
└── vercel.json                # Vercel конфиг
```

## Shared (Общие типы)

```
shared/
├── types.ts                   # TypeScript типы (Service, Master, Booking и т.д.)
└── package.json               # Зависимости shared
```

## Supabase (База данных)

```
supabase/
├── migrations/                # SQL миграции
│   ├── 001_initial_schema.sql # Создание таблиц
│   └── 002_rls_policies.sql  # Row Level Security политики
├── test-data.sql              # Тестовые данные
├── reset-and-add-data.sql     # Сброс и добавление данных
├── update-calendar-ids.sql    # Обновление Calendar ID
├── disable-rls-temp.sql       # Отключение RLS для разработки
├── check-permissions.sql      # Проверка прав доступа
├── diagnose.sql               # Диагностика БД
└── useful-queries.sql         # Полезные SQL запросы
```

## Docs (Документация)

```
docs/
└── ARCHITECTURE.md            # Архитектура проекта
```

## Таблицы базы данных

### Основные таблицы:

1. **services** - Услуги салона
   - id, name, description, price, duration_minutes

2. **masters** - Мастера
   - id, name, specialization, description, google_calendar_id

3. **master_services** - Связь мастеров и услуг
   - master_id, service_id

4. **bookings** - Записи клиентов
   - id, client_telegram_id, master_id, service_id, booking_date, booking_time, status

5. **admins** - Администраторы
   - telegram_id, name, role

## Переменные окружения

### Корень (.env):
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

### Bot (bot/.env):
```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_ID=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
WEBAPP_URL=
TIMEZONE=Europe/Moscow
NODE_ENV=development
```

### WebApp (webapp/.env):
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BOT_API_URL=
```

## Важные файлы (НЕ КОММИТИТЬ!)

⚠️ Эти файлы должны быть в `.gitignore`:

- `.env` (все)
- `bot/google-service-account.json`
- `node_modules/`
- `dist/`
- `build/`

## Команды для работы

```powershell
# Установка зависимостей
bun install

# Запуск бота
cd bot && bun run dev

# Запуск webapp
cd webapp && bun run dev

# Проверка кода
bunx @biomejs/biome check --write .

# Деплой webapp на Vercel
cd webapp && vercel
```

## Порты

- Bot API: `3001`
- WebApp (dev): `5173`

## Полезные ссылки

- [Полная инструкция по настройке](./SETUP_GUIDE.md)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [BotFather](https://t.me/BotFather)

---

**Для настройки проекта с нуля читай [SETUP_GUIDE.md](./SETUP_GUIDE.md)!**
