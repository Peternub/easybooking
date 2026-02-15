# 🚀 Быстрая настройка проекта

## Для новых разработчиков

Если вы впервые настраиваете проект, следуйте этой инструкции.

## Шаг 1: Установка зависимостей

```powershell
bun install
```

## Шаг 2: Настройка Supabase

### Создание проекта
1. Откройте [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте URL и API ключи

### Создание базы данных
В Supabase SQL Editor выполните по порядку:

1. `supabase/migrations/001_initial_schema.sql` - создание таблиц
2. `supabase/disable-rls-temp.sql` - отключение RLS (для разработки)
3. `supabase/test-data.sql` - тестовые данные

### Добавление администратора
```sql
INSERT INTO admins (telegram_id, name)
VALUES (ваш_telegram_id, 'Ваше имя');
```

Узнать свой Telegram ID: [@userinfobot](https://t.me/userinfobot)

## Шаг 3: Настройка переменных окружения

Создайте файлы на основе примеров:
- `.env` (скопируйте из `.env.example`)
- `bot/.env` (скопируйте из `bot/.env.example`)
- `webapp/.env` (скопируйте из `webapp/.env.example`)

Заполните ключи Supabase и токен Telegram бота.

## Шаг 4: Запуск

```powershell
# Терминал 1 - Бот
cd bot
bun run dev

# Терминал 2 - Веб-приложение
cd webapp
bun run dev
```

## Шаг 5: Тестирование

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Нажмите "Записаться на услугу"
4. Пройдите процесс бронирования

## Полезные команды

```powershell
# Проверка кода
bun run lint

# Автоматическое исправление
bun run lint:fix

# Форматирование
bun run format
```

## Диагностика проблем

Если что-то не работает:

1. **Услуги не загружаются:**
   - Проверьте переменные окружения
   - Выполните `supabase/diagnose.sql` в Supabase
   - Перезапустите dev сервер

2. **Бот не отвечает:**
   - Проверьте токен бота
   - Убедитесь что бот запущен
   - Проверьте логи в консоли

3. **Ошибки в консоли:**
   - Откройте DevTools (F12)
   - Посмотрите вкладку Console
   - Проверьте вкладку Network

## Дополнительная документация

- `README.md` - Общее описание проекта
- `docs/ARCHITECTURE.md` - Архитектура системы
- `docs/SETUP.md` - Подробная настройка
- `docs/GOOGLE_CALENDAR.md` - Настройка Google Calendar
- `SUPABASE_FRESH_START.md` - Настройка Supabase с нуля
- `FIX_NOW.md` - Быстрое исправление проблем

## Деплой на Vercel

См. инструкцию в `docs/SETUP.md`

## Поддержка

Если возникли проблемы, проверьте:
1. Логи в консоли бота
2. Логи в консоли браузера (F12)
3. Данные в Supabase Table Editor
4. Выполните `supabase/diagnose.sql`
