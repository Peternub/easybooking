# 📚 Полная инструкция по настройке проекта EasyBooking

## 🎯 Что это за проект

Telegram Mini App для записи клиентов к мастерам с интеграцией Google Calendar.

**Стек:**
- Bot: Bun + Grammy (Telegram Bot)
- WebApp: React + Vite + TypeScript
- Database: Supabase (PostgreSQL)
- Calendar: Google Calendar API (Service Account)

---

## 📋 Шаг 1: Предварительные требования

Установи на компьютер:
- [Bun](https://bun.sh/) - JavaScript runtime
- [Git](https://git-scm.com/) - система контроля версий
- Аккаунт [Telegram](https://telegram.org/)
- Аккаунт [Supabase](https://supabase.com/)
- Аккаунт [Google Cloud](https://console.cloud.google.com/)
- Аккаунт [Vercel](https://vercel.com/) (для деплоя webapp)

---

## 📋 Шаг 2: Создание Telegram бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь команду `/newbot`
3. Введи имя бота (например: `EasyBooking Bot`)
4. Введи username бота (например: `EasyBookinggBot`)
5. Сохрани **Bot Token** (например: `8465908772:AAH3YlaXCcIx44pDPsoTx-qzEy92OSSLwMo`)

### Настройка Mini App:

6. Отправь `/newapp` в BotFather
7. Выбери своего бота
8. Введи название Mini App
9. Введи описание
10. Загрузи иконку (512x512 px)
11. Отправь GIF/фото для превью
12. Введи короткое название (для кнопки)
13. **ВАЖНО:** Когда попросит Web App URL, введи временный: `https://example.com` (обновим позже)

### Получить свой Telegram ID:

14. Открой [@userinfobot](https://t.me/userinfobot)
15. Нажми Start
16. Сохрани свой **ID** (например: `7766545820`) - это будет ADMIN_ID

---

## 📋 Шаг 3: Создание проекта Supabase

1. Открой [Supabase](https://supabase.com/)
2. Нажми **New Project**
3. Выбери организацию или создай новую
4. Введи название проекта (например: `easybooking`)
5. Придумай Database Password (сохрани его!)
6. Выбери регион (ближайший к пользователям)
7. Нажми **Create new project** (подожди 2-3 минуты)

### Получить credentials:

8. Перейди в **Settings** → **API**
9. Сохрани:
   - **Project URL** (например: `https://zbrfwbewauwmmxqsczug.supabase.co`)
   - **anon public** key
   - **service_role** key (секретный!)

---

## 📋 Шаг 4: Настройка базы данных

1. В Supabase перейди в **SQL Editor**
2. Нажми **New Query**
3. Скопируй содержимое файла `supabase/migrations/001_initial_schema.sql`
4. Вставь в редактор и нажми **Run**
5. Повтори для файла `supabase/migrations/002_rls_policies.sql`

### Отключить RLS для разработки:

6. Выполни SQL из файла `supabase/disable-rls-temp.sql`:
```sql
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE masters DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE master_services DISABLE ROW LEVEL SECURITY;
```

### Добавить тестовые данные:

7. Выполни SQL из файла `supabase/test-data.sql`

### Добавить себя как админа:

8. Выполни SQL (замени `7766545820` на свой Telegram ID):
```sql
INSERT INTO admins (telegram_id, name, role)
VALUES (7766545820, 'Твоё имя', 'owner');
```

---

## 📋 Шаг 5: Настройка Google Calendar

### Создать проект в Google Cloud:

1. Открой [Google Cloud Console](https://console.cloud.google.com/)
2. Нажми **Select a project** → **New Project**
3. Введи название (например: `tgbotkiro`)
4. Нажми **Create**

### Включить Calendar API:

5. В меню слева: **APIs & Services** → **Library**
6. Найди **Google Calendar API**
7. Нажми **Enable**

### Создать Service Account:

8. **APIs & Services** → **Credentials**
9. **Create Credentials** → **Service Account**
10. Введи имя (например: `easybooking-calendar`)
11. Нажми **Create and Continue**
12. Пропусти опциональные шаги → **Done**

### Получить JSON ключ:

13. Нажми на созданный Service Account
14. Вкладка **Keys**
15. **Add Key** → **Create new key**
16. Выбери **JSON**
17. Нажми **Create** (файл скачается)
18. Переименуй файл в `google-service-account.json`
19. Положи в папку `bot/`

### Создать календари для мастеров:

20. Открой [Google Calendar](https://calendar.google.com/)
21. Слева нажми **+** возле "Другие календари"
22. **Создать календарь**
23. Введи название: `Анна Иванова`
24. Нажми **Создать календарь**
25. Повтори для `Мария Петрова` и `Елена Сидорова`

### Дать доступ Service Account к календарям:

Для КАЖДОГО из 3 календарей:

26. Нажми три точки возле календаря → **Настройки и доступ**
27. Прокрути до **"Доступ для отдельных пользователей"**
28. **Добавить пользователей**
29. Введи email из JSON файла (поле `client_email`)
30. Права: **"Внесение изменений в мероприятия"**
31. **Отправить**

### Получить Calendar ID:

Для каждого календаря:

32. Три точки → **Настройки и доступ**
33. Прокрути до **"Интеграция календаря"**
34. Скопируй **"Идентификатор календаря"**
35. Сохрани все 3 ID

### Обновить базу данных:

36. В Supabase SQL Editor выполни (замени ID на свои):
```sql
UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_АННЫ'
WHERE name = 'Анна Иванова';

UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_МАРИИ'
WHERE name = 'Мария Петрова';

UPDATE masters
SET google_calendar_id = 'CALENDAR_ID_ЕЛЕНЫ'
WHERE name = 'Елена Сидорова';
```

---

## 📋 Шаг 6: Настройка переменных окружения

### Корневая папка `.env`:

```env
SUPABASE_URL=твой_supabase_url
SUPABASE_ANON_KEY=твой_anon_key
```

### Папка `bot/.env`:

```env
TELEGRAM_BOT_TOKEN=твой_bot_token
TELEGRAM_ADMIN_ID=твой_telegram_id
SUPABASE_URL=твой_supabase_url
SUPABASE_ANON_KEY=твой_anon_key
SUPABASE_SERVICE_KEY=твой_service_role_key
WEBAPP_URL=https://твой-домен.vercel.app/
TIMEZONE=Europe/Moscow
NODE_ENV=development
```

### Папка `webapp/.env`:

```env
VITE_SUPABASE_URL=твой_supabase_url
VITE_SUPABASE_ANON_KEY=твой_anon_key
VITE_BOT_API_URL=http://localhost:3001
```

---

## 📋 Шаг 7: Установка зависимостей

```powershell
# Корневая папка
bun install

# Bot
cd bot
bun install

# WebApp
cd ../webapp
bun install
```

---

## 📋 Шаг 8: Деплой WebApp на Vercel

1. Открой [Vercel](https://vercel.com/)
2. **Add New** → **Project**
3. Импортируй свой GitHub репозиторий
4. **Root Directory**: выбери `webapp`
5. **Framework Preset**: Vite
6. **Environment Variables**: добавь переменные из `webapp/.env`
7. Нажми **Deploy**
8. Сохрани URL (например: `https://easybooking-webapp.vercel.app/`)

### Обновить Bot API URL:

9. В `webapp/.env` замени:
```env
VITE_BOT_API_URL=https://твой-бот-домен.com
```
(Пока оставь localhost, обновишь после деплоя бота)

### Обновить Mini App URL в BotFather:

10. Открой [@BotFather](https://t.me/BotFather)
11. Отправь `/myapps`
12. Выбери свой бот
13. **Edit Web App URL**
14. Введи URL Vercel: `https://easybooking-webapp.vercel.app/`

---

## 📋 Шаг 9: Запуск локально

### Запустить бота:

```powershell
cd bot
bun run dev
```

Должно появиться:
```
✅ Бот успешно запущен!
🌐 API сервер запущен на порту 3001
```

### Запустить webapp (в другом терминале):

```powershell
cd webapp
bun run dev
```

Откроется `http://localhost:5173`

---

## 📋 Шаг 10: Тестирование

1. Открой своего бота в Telegram
2. Нажми **Start**
3. Нажми кнопку **Записаться**
4. Выбери услугу, мастера, дату и время
5. Нажми **Записаться**

### Проверь:

- ✅ Запись создалась в Supabase (таблица `bookings`)
- ✅ Пришло уведомление клиенту
- ✅ Пришло уведомление админу
- ✅ Событие появилось в Google Calendar мастера

---

## 🚀 Деплой бота на сервер

### Вариант 1: VPS (Ubuntu)

```bash
# Установить Bun
curl -fsSL https://bun.sh/install | bash

# Клонировать репозиторий
git clone твой_репозиторий
cd EasyBooking/bot

# Установить зависимости
bun install

# Создать .env файл
nano .env
# (вставь переменные окружения)

# Запустить с PM2
bun pm2 start src/index.ts --name easybooking-bot
```

### Вариант 2: Railway/Render

1. Создай аккаунт на [Railway](https://railway.app/) или [Render](https://render.com/)
2. Подключи GitHub репозиторий
3. Выбери папку `bot`
4. Добавь переменные окружения
5. Deploy

---

## 📁 Структура проекта

```
EasyBooking/
├── bot/                          # Telegram бот
│   ├── src/
│   │   ├── handlers/            # Обработчики команд
│   │   ├── services/            # Сервисы (Supabase, Google Calendar)
│   │   ├── api/                 # API endpoints
│   │   └── index.ts             # Точка входа
│   ├── google-service-account.json  # Google Service Account ключ
│   └── .env                     # Переменные окружения
├── webapp/                       # Mini App (React)
│   ├── src/
│   │   ├── components/          # React компоненты
│   │   ├── pages/               # Страницы
│   │   └── services/            # API клиенты
│   └── .env                     # Переменные окружения
├── supabase/                     # SQL скрипты
│   └── migrations/              # Миграции БД
└── shared/                       # Общие типы TypeScript
```

---

## 🔧 Полезные команды

```powershell
# Проверка кода
bunx @biomejs/biome check --write .

# Запуск тестов
bun test

# Сборка для продакшена
bun run build

# Просмотр логов бота
pm2 logs easybooking-bot
```

---

## 🐛 Частые проблемы

### Бот не отвечает:
- Проверь Bot Token в `.env`
- Убедись что бот запущен (`bun run dev`)

### Mini App не открывается:
- Проверь URL в BotFather
- Убедись что webapp задеплоен на Vercel

### Не создаются события в календаре:
- Проверь что Service Account имеет доступ к календарям
- Проверь Calendar ID в базе данных
- Проверь файл `google-service-account.json`

### Ошибки Supabase:
- Проверь что RLS отключен для разработки
- Проверь credentials в `.env`

---

## 📝 Что настроить под свой проект

1. **Услуги и мастера**: измени в `supabase/test-data.sql`
2. **Часовой пояс**: измени `TIMEZONE` в `bot/.env`
3. **Интервалы времени**: измени в `webapp/src/components/SelectDateTime.tsx`
4. **Стили**: измени в `webapp/src/index.css`
5. **Тексты уведомлений**: измени в `bot/src/api/notify-booking.ts`

---

## ✅ Чеклист готовности к продакшену

- [ ] RLS включен в Supabase
- [ ] Все `.env` файлы в `.gitignore`
- [ ] `google-service-account.json` в `.gitignore`
- [ ] WebApp задеплоен на Vercel
- [ ] Бот задеплоен на сервере
- [ ] Настроены напоминания (cron jobs)
- [ ] Протестированы все сценарии
- [ ] Настроен мониторинг ошибок

---

## 📞 Поддержка

Если что-то не работает:
1. Проверь логи бота
2. Проверь консоль браузера (F12)
3. Проверь Supabase logs
4. Проверь переменные окружения

---

**Готово! Проект настроен и готов к использованию! 🎉**
