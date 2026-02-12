# 🏗 Архитектура проекта

## Общая схема

```
┌─────────────────┐
│  Telegram User  │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  Telegram Bot   │  │   Mini App   │
│   (Grammy)      │  │   (React)    │
└────────┬────────┘  └──────┬───────┘
         │                  │
         │                  │
         ▼                  ▼
┌──────────────────────────────────┐
│         Supabase                 │
│  (PostgreSQL + Auth + Storage)   │
└──────────────────────────────────┘
         │
         │
         ▼
┌──────────────────────────────────┐
│      Google Calendar API         │
└──────────────────────────────────┘
```

## Компоненты системы

### 1. Telegram Bot (Grammy)

**Назначение**: Обработка команд, отправка уведомлений

**Основные модули**:
- `handlers/` - Обработчики команд и callback
- `services/` - Бизнес-логика (Supabase, Google Calendar)
- `notifications/` - Система уведомлений
- `utils/` - Вспомогательные функции

**Ключевые функции**:
- Команда `/start` - главное меню
- Команда `/mybookings` - список записей
- Обработка данных из Mini App
- Отправка напоминаний (за 24ч, за 1ч)
- Запрос отзывов (через 2ч после визита)
- Уведомления администратора

**Технологии**:
- Grammy (Telegram Bot Framework)
- Supabase JS Client
- Google APIs
- date-fns (работа с датами)

### 2. Mini App (React)

**Назначение**: Интерфейс для бронирования и отзывов

**Структура страниц**:
```
/                    - Процесс бронирования
  ├─ Выбор услуги
  ├─ Выбор мастера
  ├─ Выбор даты/времени
  └─ Подтверждение

/review/:bookingId   - Форма отзыва
/admin               - Админ-панель (в разработке)
```

**Компоненты**:
- `SelectService` - Выбор услуги
- `SelectMaster` - Выбор мастера
- `SelectDateTime` - Выбор даты и времени
- `BookingConfirmation` - Подтверждение записи

**Технологии**:
- React 18
- Vite (сборщик)
- TypeScript
- @telegram-apps/telegram-ui (UI компоненты)
- React Router (маршрутизация)

### 3. Supabase (База данных)

**Назначение**: Хранение всех данных системы

**Таблицы**:

```sql
masters                      -- Мастера
├─ id (uuid)
├─ name (text)
├─ photo_url (text)
├─ description (text)
├─ specialization (text)
├─ google_calendar_id (text)
└─ is_active (boolean)

services                     -- Услуги
├─ id (uuid)
├─ name (text)
├─ description (text)
├─ price (integer)
├─ duration_minutes (integer)
├─ category (text)
└─ is_active (boolean)

master_services              -- Связь мастеров и услуг
├─ master_id (uuid) FK
└─ service_id (uuid) FK

master_schedules             -- График работы
├─ id (uuid)
├─ master_id (uuid) FK
├─ day_of_week (integer)     -- 0=Пн, 6=Вс
├─ start_time (time)
├─ end_time (time)
└─ is_working (boolean)

master_schedule_exceptions   -- Отпуска, выходные
├─ id (uuid)
├─ master_id (uuid) FK
├─ date (date)
└─ reason (text)

bookings                     -- Записи
├─ id (uuid)
├─ client_telegram_id (bigint)
├─ client_name (text)
├─ client_username (text)
├─ master_id (uuid) FK
├─ service_id (uuid) FK
├─ booking_date (date)
├─ booking_time (time)
├─ status (text)             -- active, completed, cancelled_*
├─ cancellation_reason (text)
├─ google_event_id (text)
└─ created_at, updated_at

reviews                      -- Отзывы
├─ id (uuid)
├─ booking_id (uuid) FK
├─ client_telegram_id (bigint)
├─ master_id (uuid) FK
├─ service_id (uuid) FK
├─ rating (integer)          -- 1-5
├─ comment (text)
└─ created_at

admins                       -- Администраторы
├─ telegram_id (bigint) PK
├─ name (text)
└─ added_at
```

**Row Level Security (RLS)**:
- Клиенты видят только свои записи
- Администраторы видят все данные
- Все могут читать активные услуги и мастеров

### 4. Google Calendar API

**Назначение**: Визуализация расписания и проверка занятости

**Функции**:
- Создание событий при бронировании
- Удаление событий при отмене
- Проверка занятых слотов
- Ручная блокировка времени администратором

**Структура событий**:
```javascript
{
  summary: "Запись: Имя Клиента",
  description: "Клиент: Имя\nTelegram: @username",
  start: { dateTime: "2026-02-15T10:00:00+03:00" },
  end: { dateTime: "2026-02-15T11:00:00+03:00" }
}
```

## Потоки данных

### Создание записи

```
1. Клиент → Mini App: Выбор услуги, мастера, времени
2. Mini App → Telegram: sendData() с данными записи
3. Telegram → Bot: webhook с данными
4. Bot → Supabase: Создание записи в БД
5. Bot → Google Calendar: Создание события
6. Bot → Supabase: Обновление google_event_id
7. Bot → Клиент: Уведомление об успехе
8. Bot → Админ: Уведомление о новой записи
```

### Отмена записи

```
1. Клиент → Bot: Нажатие кнопки "Отменить"
2. Bot → Supabase: Обновление статуса записи
3. Bot → Google Calendar: Удаление события
4. Bot → Клиент: Подтверждение отмены
5. Bot → Админ: Уведомление об отмене
```

### Система уведомлений

```
Планировщик (каждые 5 минут):
├─ Проверка записей через 24 часа
│  └─ Отправка напоминания с кнопкой отмены
├─ Проверка записей через 1 час
│  └─ Отправка короткого напоминания
└─ Проверка завершенных записей (2 часа назад)
   └─ Отправка запроса на отзыв
```

### Оставление отзыва

```
1. Клиент → Bot: Получение уведомления
2. Клиент → Mini App: Переход по кнопке
3. Mini App: Форма отзыва (1-5 звезд + текст)
4. Mini App → Telegram: sendData() с отзывом
5. Telegram → Bot: webhook с данными
6. Bot → Supabase: Сохранение отзыва
7. Bot → Клиент: Благодарность
8. Bot → Админ: Уведомление о новом отзыве
```

## Безопасность

### Аутентификация

**Telegram WebApp**:
- Проверка initData от Telegram
- Валидация подписи через HMAC-SHA256
- Извлечение user.id для идентификации

**Supabase RLS**:
- Политики на уровне строк
- Проверка telegram_id из JWT claims
- Функция `is_admin()` для проверки прав

### Авторизация

**Клиенты**:
- Могут создавать записи
- Видят только свои записи
- Могут отменять только свои активные записи
- Могут оставлять отзывы только к своим записям

**Администраторы**:
- Полный доступ ко всем данным
- Могут управлять мастерами и услугами
- Могут отменять любые записи с указанием причины
- Получают уведомления о всех действиях

## Обработка ошибок

### Google Calendar недоступен

```javascript
try {
  await createCalendarEvent(...);
} catch (error) {
  console.error('Ошибка Google Calendar:', error);
  // Продолжаем работу без календаря
  // Запись сохраняется в Supabase
}
```

### Двойное бронирование

```sql
-- Уникальный индекс предотвращает дубликаты
UNIQUE (master_id, booking_date, booking_time)
```

При попытке создать дубликат:
- Supabase вернет ошибку
- Клиент получит сообщение "Слот уже занят"

### Отказоустойчивость

- Supabase - источник истины (Master Data)
- Google Calendar - вспомогательный инструмент
- Система работает даже если Calendar недоступен
- Все критичные операции логируются

## Масштабирование

### Текущая архитектура

- Один бот на Vercel (serverless)
- Mini App на Vercel (CDN)
- Supabase (managed PostgreSQL)
- Google Calendar (managed API)

### Ограничения

- **Telegram Bot API**: 30 сообщений/секунду
- **Supabase Free**: 500 MB БД, 2 GB трафика
- **Google Calendar API**: 1,000,000 запросов/день

### Рекомендации для роста

1. **> 1000 записей/день**:
   - Перейти на Supabase Pro
   - Добавить кэширование (Redis)

2. **> 10 мастеров**:
   - Оптимизировать запросы к Calendar
   - Использовать batch операции

3. **> 100,000 пользователей**:
   - Разделить бота на микросервисы
   - Использовать очереди (Bull/BullMQ)
   - Добавить мониторинг (Sentry)

## Мониторинг

### Логирование

```javascript
// Все критичные операции логируются
console.log('✅ Запись создана:', bookingId);
console.error('❌ Ошибка:', error);
```

### Метрики для отслеживания

- Количество записей в день
- Процент отмен
- Средний рейтинг мастеров
- Время отклика API
- Ошибки Google Calendar

### Рекомендуемые инструменты

- **Sentry** - отслеживание ошибок
- **Vercel Analytics** - производительность
- **Supabase Dashboard** - метрики БД
- **Google Cloud Console** - квоты API

## Развертывание

### Development

```
Bot: localhost:3000 (long polling)
Mini App: localhost:3000 (Vite dev server)
```

### Production

```
Bot: Vercel Serverless (webhook)
Mini App: Vercel Edge Network (CDN)
Database: Supabase Cloud
Calendar: Google Cloud
```

## Будущие улучшения

### Фаза 2
- [ ] Админ-панель в Mini App
- [ ] Статистика и аналитика
- [ ] Экспорт данных в Excel
- [ ] Интеграция с платежами

### Фаза 3
- [ ] Мобильное приложение для мастеров
- [ ] Push-уведомления
- [ ] Программа лояльности
- [ ] Интеграция с CRM

### Фаза 4
- [ ] AI-рекомендации времени
- [ ] Автоматическое распределение нагрузки
- [ ] Предиктивная аналитика
- [ ] Чат-бот для консультаций
