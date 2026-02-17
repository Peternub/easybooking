# Настройка 3 календарей для мастеров

## Быстрая инструкция

### Шаг 1: Создайте 3 календаря в Google Calendar

1. Откройте [Google Calendar](https://calendar.google.com/)
2. Создайте первый календарь:
   - Слева нажмите "+" рядом с "Other calendars"
   - Выберите "Create new calendar"
   - Название: **Анна Иванова**
   - Описание: Календарь записей мастера Анны Ивановой
   - Часовой пояс: Europe/Moscow
   - Нажмите "Create calendar"

3. Повторите для остальных мастеров:
   - **Мария Петрова**
   - **Елена Сидорова**

### Шаг 2: Получите Calendar ID для каждого календаря

Для каждого созданного календаря:

1. Найдите календарь в списке слева
2. Нажмите на три точки → "Settings and sharing"
3. Прокрутите до раздела "Integrate calendar"
4. Скопируйте **Calendar ID** (выглядит как `abc123@group.calendar.google.com`)

Запишите ID для каждого мастера:
```
Анна Иванова: _______________________________
Мария Петрова: _______________________________
Елена Сидорова: _______________________________
```

### Шаг 3: Обновите данные в Supabase

Выполните SQL запрос в Supabase SQL Editor:

```sql
-- Обновите Calendar ID для каждого мастера
UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_АННЫ'
WHERE name = 'Анна Иванова';

UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_МАРИИ'
WHERE name = 'Мария Петрова';

UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_ЕЛЕНЫ'
WHERE name = 'Елена Сидорова';

-- Проверка
SELECT name, google_calendar_id FROM masters ORDER BY name;
```

### Шаг 4: Настройте Google Calendar API

Если еще не настроили, следуйте инструкции в `docs/GOOGLE_CALENDAR.md`:

1. Создайте проект в Google Cloud Console
2. Включите Google Calendar API
3. Создайте OAuth 2.0 credentials
4. Получите Refresh Token

### Шаг 5: Добавьте credentials в .env

Обновите файл `bot/.env`:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

### Шаг 6: Проверьте работу

После настройки создайте тестовую запись через Mini App и проверьте, что событие появилось в соответствующем календаре мастера.

## Как это работает

1. Когда клиент создает запись через Mini App:
   - Запись сохраняется в Supabase
   - Бот получает уведомление
   - Бот создает событие в Google Calendar мастера (используя `google_calendar_id`)

2. Каждый мастер имеет свой отдельный календарь:
   - Анна Иванова → Календарь 1
   - Мария Петрова → Календарь 2
   - Елена Сидорова → Календарь 3

3. Уникальное ограничение `UNIQUE (master_id, booking_date, booking_time)` в базе данных не позволяет двум клиентам записаться к одному мастеру на одно время.

## Проверка настройки

Выполните в Supabase SQL Editor:

```sql
-- Проверка что у всех мастеров есть Calendar ID
SELECT 
  name as "Мастер",
  CASE 
    WHEN google_calendar_id IS NOT NULL THEN '✅ Настроен'
    ELSE '❌ Не настроен'
  END as "Статус календаря",
  google_calendar_id as "Calendar ID"
FROM masters
ORDER BY name;
```

## Troubleshooting

### Календарь не создается
- Проверьте что Google Calendar API включен
- Проверьте credentials в `.env`
- Проверьте логи бота

### События не появляются в календаре
- Проверьте что `google_calendar_id` правильный
- Проверьте права доступа к календарю
- Проверьте что refresh token действителен

### Ошибка "Calendar not found"
- Убедитесь что Calendar ID скопирован правильно
- Проверьте что календарь не удален
- Проверьте права доступа

## Дополнительно

### Цветовая кодировка календарей

Можно настроить разные цвета для каждого мастера:

1. В Google Calendar нажмите на календарь
2. Выберите цвет из палитры
3. Это поможет визуально различать записи разных мастеров

### Общий доступ

Если нужно дать доступ администратору ко всем календарям:

1. Для каждого календаря откройте "Settings and sharing"
2. В разделе "Share with specific people" добавьте email администратора
3. Выберите права "Make changes to events"

### Синхронизация

Календари автоматически синхронизируются:
- С мобильными устройствами (если установлен Google Calendar)
- С другими приложениями через Calendar API
- В реальном времени
