# System Patterns

## Архитектурный паттерн

Проект построен как Bun workspace с разделением на frontend Mini App, backend-бот с HTTP API, общий слой типов и отдельный слой схемы данных PostgreSQL.

## Основные подсистемы

### Web App

- `webapp/src/App.tsx` задает маршрутизацию клиентских и административных экранов;
- booking flow разбит на шаги выбора услуги, мастера, даты и подтверждения;
- административные страницы используют единый API-клиент из `webapp/src/services/api.ts`.

### Bot and API

- `bot/src/index.ts` запускает Grammy-бота и Bun HTTP server;
- API-слой в `bot/src/api/` обслуживает бронирование, проверки доступности, загрузки фото, промокоды, отзывы и админские операции;
- bot handlers отвечают за Telegram-команды и входные сценарии пользователя.

### Data Access

- `bot/src/services/postgres.ts` и `bot/src/services/data.ts` инкапсулируют работу с PostgreSQL;
- `shared/types.ts` хранит доменные типы, которые разделяются между backend и frontend;
- `postgres/schema.sql` фиксирует таблицы, индексы, триггеры и представление `bookings_readable`.

### Notifications

- `bot/src/notifications/scheduler.ts` запускает периодическую проверку уведомлений;
- `bot/src/notifications/reminders.ts` отвечает за напоминания за 24 часа, за 1 час и запрос отзывов после визита.

## Потоки данных

1. Клиентский экран выбирает услугу, мастера и время.
2. Frontend вызывает backend endpoint через `webapp/src/services/api.ts`.
3. Backend валидирует запрос и пишет запись в PostgreSQL.
4. После создания записи backend инициирует Telegram-уведомление клиенту.
5. Админские экраны читают агрегированные данные и справочники из backend API.

## Стабильные границы

- frontend не обращается к базе напрямую;
- shared-типизация используется как контракт между слоями;
- вся бизнес-логика записи и административных сценариев проходит через backend;
- high-level архитектурная синхронизация ведется через `docs/README.md`.
