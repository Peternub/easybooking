# 🚀 Настройка переменных окружения на Vercel

## Проблема

Сайт показывает белый экран с ошибкой:
```
❌ Supabase credentials are missing!
VITE_SUPABASE_URL: отсутствует
VITE_SUPABASE_ANON_KEY: отсутствует
```

## Причина

Переменные окружения не настроены в Vercel. Файл `.env` работает только локально, на продакшене нужно настроить их через панель Vercel.

## Решение

### Вариант 1: Через Vercel Dashboard (рекомендуется)

1. Откройте [vercel.com](https://vercel.com)
2. Войдите в свой аккаунт
3. Выберите проект `easybooking` (или как он называется)
4. Перейдите в **Settings** → **Environment Variables**
5. Добавьте следующие переменные:

**Переменная 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://tvqplvgkzrzxbdspdsix.supabase.co`
- **Environment:** Production, Preview, Development (выберите все)

**Переменная 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXBsdmdrenJ6eGJkc3Bkc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjM0MDUsImV4cCI6MjA4NjM5OTQwNX0.D4kfNOVDufIXxj-Wl6nAEy9Qn3fifrwhhmgCf4bLyxA`
- **Environment:** Production, Preview, Development (выберите все)

6. Нажмите **Save**
7. Перейдите в **Deployments**
8. Нажмите на последний деплой → **Redeploy**

### Вариант 2: Через Vercel CLI

```powershell
# Установите Vercel CLI (если еще не установлен)
npm install -g vercel

# Войдите в аккаунт
vercel login

# Перейдите в папку webapp
cd webapp

# Добавьте переменные окружения
vercel env add VITE_SUPABASE_URL
# Введите значение: https://tvqplvgkzrzxbdspdsix.supabase.co
# Выберите: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Введите значение: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cXBsdmdrenJ6eGJkc3Bkc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjM0MDUsImV4cCI6MjA4NjM5OTQwNX0.D4kfNOVDufIXxj-Wl6nAEy9Qn3fifrwhhmgCf4bLyxA
# Выберите: Production, Preview, Development

# Задеплойте заново
vercel --prod
```

## Проверка

После настройки переменных и редеплоя:

1. Откройте сайт: https://easybooking-webapp.vercel.app
2. Откройте консоль браузера (F12)
3. Вы должны увидеть загрузку данных вместо ошибки

## Для локальной разработки

Если хотите тестировать локально:

```powershell
# Перейдите в папку webapp
cd webapp

# Запустите dev сервер
bun run dev
```

Локально будет использоваться файл `webapp/.env` который уже настроен.

## Важно!

После добавления переменных окружения на Vercel **обязательно нужно сделать редеплой** (Redeploy), иначе изменения не применятся.

## Дополнительно: Настройка для бота

Если бот тоже задеплоен на Vercel, добавьте для него переменные:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REFRESH_TOKEN`
- `WEBAPP_URL`
- `TIMEZONE`
- `NODE_ENV`

Значения возьмите из файла `bot/.env`.
