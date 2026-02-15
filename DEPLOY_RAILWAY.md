# Деплой на Railway (всё в одном)

Этот гайд поможет задеплоить бота и webapp на одном сервере Railway.

## Что будет работать

- ✅ Telegram бот (long polling)
- ✅ Mini App (статические файлы)
- ✅ API для уведомлений
- ✅ Всё на одном домене

## Шаг 1: Подготовка

Убедитесь что все изменения закоммичены:

```powershell
git add -A
git commit -m "feat: единый сервер для бота и webapp"
git push
```

## Шаг 2: Создание проекта на Railway

1. Откройте https://railway.app
2. Нажмите **New Project**
3. Выберите **Deploy from GitHub repo**
4. Выберите ваш репозиторий `easybooking`
5. Railway автоматически определит настройки из `railway.json`

## Шаг 3: Настройка переменных окружения

В Railway добавьте все переменные окружения:

### Из bot/.env:
```
TELEGRAM_BOT_TOKEN=8465908772:AAH3YlaXCcIx44pDPsoTx-qzEy92OSSLwMo
TELEGRAM_ADMIN_ID=7766545820
SUPABASE_URL=https://zbrfwbewauwmmxqsczug.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEBAPP_URL=https://ваш-домен.up.railway.app
TIMEZONE=Europe/Moscow
NODE_ENV=production
```

### Из webapp/.env:
```
VITE_SUPABASE_URL=https://zbrfwbewauwmmxqsczug.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Важно:** `WEBAPP_URL` и `VITE_BOT_API_URL` будут одинаковыми - это URL вашего Railway проекта.

## Шаг 4: Деплой

1. Railway автоматически начнет деплой
2. Дождитесь завершения (3-5 минут)
3. Скопируйте URL проекта (например: `https://easybooking.up.railway.app`)

## Шаг 5: Обновление URL в Telegram

1. Откройте BotFather в Telegram
2. Отправьте `/setmenubutton`
3. Выберите вашего бота
4. Обновите URL Mini App на: `https://ваш-домен.up.railway.app`

## Шаг 6: Тестирование

1. Откройте бота в Telegram
2. Нажмите кнопку "Записаться"
3. Создайте запись
4. Проверьте что:
   - Запись создалась в Supabase
   - Пришло уведомление вам
   - Пришло уведомление админу

## Проверка логов

В Railway можно смотреть логи в реальном времени:
1. Откройте ваш проект
2. Перейдите в **Deployments**
3. Нажмите на активный деплой
4. Смотрите логи

Должны быть сообщения:
```
✅ Бот успешно запущен!
🌐 Сервер запущен на порту 3000
```

## Troubleshooting

### Бот не запускается
- Проверьте что все переменные окружения добавлены
- Проверьте логи в Railway
- Убедитесь что `TELEGRAM_BOT_TOKEN` правильный

### Mini App не открывается
- Проверьте что URL в BotFather правильный
- Проверьте что webapp собрался (должна быть папка `webapp/dist`)

### Уведомления не приходят
- Проверьте логи - должно быть "📨 Получен запрос на отправку уведомлений"
- Проверьте что `TELEGRAM_ADMIN_ID` правильный
- Проверьте что бот не заблокирован пользователем

## Альтернатива: Render

Если Railway не подходит, можно использовать Render:

1. Откройте https://render.com
2. Создайте **Web Service**
3. Подключите GitHub репозиторий
4. Настройте:
   - **Build Command:** `bun install && cd webapp && bun install && bun run build`
   - **Start Command:** `bun run server.ts`
5. Добавьте переменные окружения
6. Деплой

## Стоимость

- **Railway:** $5 бесплатных кредитов в месяц (хватит на небольшой проект)
- **Render:** Бесплатный план (засыпает после 15 минут неактивности)

Для продакшена рекомендую Railway - там сервис работает 24/7.
