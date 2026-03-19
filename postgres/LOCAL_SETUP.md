# Локальный запуск PostgreSQL

## 1. Установить PostgreSQL
- Скачайте Windows Installer с официального сайта PostgreSQL.
- Во время установки запомните:
  - `host`: обычно `localhost`
  - `port`: обычно `5432`
  - `user`: обычно `postgres`
  - пароль пользователя `postgres`

## 2. Инициализировать базу проекта
Из корня проекта выполните:

```powershell
.\postgres\init-local.ps1
```

Если нужны свои параметры:

```powershell
.\postgres\init-local.ps1 -HostName localhost -Port 5432 -UserName postgres -DatabaseName easybooking
```

## 3. Прописать переменные в `bot/.env`

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_ID=...
WEBAPP_URL=http://localhost:5173
POSTGRES_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/easybooking
TIMEZONE=Europe/Moscow
```

## 4. Запустить проект
- bot/backend
- webapp

## 5. Проверить
- создается запись
- запись появляется в PostgreSQL
- работает админка
- работают отзывы и напоминания
