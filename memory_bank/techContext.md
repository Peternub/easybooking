# Tech Context

## Стек

- пакетный менеджер и runtime: `bun`;
- frontend: React 18, Vite, TypeScript, `@telegram-apps/telegram-ui`, `react-router-dom`;
- backend: Bun, TypeScript, Grammy, `pg`;
- база данных: PostgreSQL;
- линтер и форматтер: Biome.

## Структура репозитория

- `bot/` - Telegram bot, HTTP API, notifications, services;
- `webapp/` - Telegram Mini App и административные страницы;
- `shared/` - общие доменные типы;
- `postgres/` - схема базы и скрипты локальной инициализации;
- `docs/` - высокоуровневая архитектурная документация;
- `memory_bank/` - долговременный операционный контекст проекта.

## Переменные окружения

Минимально ожидаются:

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_ADMIN_ID`;
- `WEBAPP_URL`;
- `TIMEZONE`;
- `POSTGRES_URL` или набор `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

## Ограничения и правила работы

- development server не запускается и не останавливается без явной необходимости пользователя;
- markdown-файлы не проверяются через Biome;
- при изменении маршрутов, модулей или архитектурных границ необходимо обновлять `docs/README.md` и Memory Bank;
- `memory_bank/projectbrief.md` является единственным источником процента выполнения проекта.
