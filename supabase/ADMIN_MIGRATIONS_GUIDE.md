# Руководство по применению миграций для админ панели

## 📋 Что добавляется

### 1. Таблица `clients` (База клиентов)
- Хранение информации о клиентах
- Заметки администратора
- Автоматическая синхронизация с записями

### 2. Расширения таблицы `masters`
- `work_schedule` - график работы (JSON)
- `phone` - телефон мастера

### 3. Расширения таблицы `bookings`
- `source` - источник записи (online/manual/phone/walk_in)
- `client_id` - связь с таблицей клиентов
- `admin_notes` - заметки администратора
- Новые статусы: `pending`, `no_show`

### 4. View `bookings_readable`
- Обновленное представление с данными клиентов

---

## 🚀 Как применить миграции

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Создайте новый запрос
5. Скопируйте и выполните каждую миграцию по очереди:

#### Шаг 1: Создание таблицы clients
```sql
-- Скопируйте содержимое файла: supabase/migrations/006_clients_table.sql
```

#### Шаг 2: Расширения для админки
```sql
-- Скопируйте содержимое файла: supabase/migrations/007_admin_enhancements.sql
```

#### Шаг 3: Синхронизация клиентов
```sql
-- Скопируйте содержимое файла: supabase/migrations/008_sync_clients.sql
```

---

### Вариант 2: Через Supabase CLI

```bash
# Если у вас установлен Supabase CLI
supabase db push
```

---

## ✅ Проверка результатов

После применения миграций выполните:

```sql
-- Проверка таблицы clients
SELECT * FROM clients LIMIT 5;

-- Проверка новых полей в masters
SELECT id, name, work_schedule, phone FROM masters;

-- Проверка новых полей в bookings
SELECT id, status, source, client_id, admin_notes FROM bookings LIMIT 5;

-- Проверка view
SELECT * FROM bookings_readable LIMIT 5;
```

---

## 📊 Структура данных

### Таблица `clients`
```
id              UUID (PK)
telegram_id     BIGINT (UNIQUE)
name            TEXT
username        TEXT
phone           TEXT
notes           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### График работы мастера (work_schedule)
```json
{
  "monday": ["10:00-18:00"],
  "tuesday": ["10:00-18:00"],
  "wednesday": ["10:00-18:00"],
  "thursday": ["10:00-18:00"],
  "friday": ["10:00-18:00"],
  "saturday": ["10:00-18:00"],
  "sunday": []
}
```

### Статусы записей
- `pending` - ожидает подтверждения
- `active` - подтверждена
- `completed` - завершена
- `cancelled` - отменена
- `no_show` - клиент не пришел

### Источники записей
- `online` - через Mini App
- `manual` - вручную администратором
- `phone` - по телефону
- `walk_in` - пришел с улицы

---

## 🔄 Автоматическая синхронизация

После применения миграций:
- Все существующие записи автоматически создадут клиентов
- При каждой новой записи клиент создается/обновляется автоматически
- Данные клиентов синхронизируются с записями

---

## ⚠️ Важно

1. Сделайте бэкап базы данных перед применением миграций
2. Миграции безопасны и не удаляют существующие данные
3. Все изменения обратимо совместимы
4. RLS политики настроены для публичного доступа (измените при необходимости)

---

## 🆘 Откат миграций (если нужно)

```sql
-- Удалить таблицу clients
DROP TABLE IF EXISTS clients CASCADE;

-- Удалить новые колонки из masters
ALTER TABLE masters DROP COLUMN IF EXISTS work_schedule;
ALTER TABLE masters DROP COLUMN IF EXISTS phone;

-- Удалить новые колонки из bookings
ALTER TABLE bookings DROP COLUMN IF EXISTS source;
ALTER TABLE bookings DROP COLUMN IF EXISTS client_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS admin_notes;

-- Восстановить старые статусы
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('active', 'completed', 'cancelled'));
```
