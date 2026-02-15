# Инструкции по деплою

## Настройка переменных окружения на Vercel

### Для webapp (Mini App)

1. Откройте https://vercel.com → ваш проект webapp
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте переменную:
   - **Name:** `VITE_BOT_API_URL`
   - **Value:** URL вашего бота API (см. ниже)
   - **Environment:** Production, Preview, Development

### Деплой бота

Бот должен быть задеплоен на платформу, которая поддерживает постоянный HTTP сервер.

#### Вариант 1: Railway (рекомендуется)

1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Настройте:
   - **Root Directory:** `bot`
   - **Build Command:** `bun install`
   - **Start Command:** `bun run src/index.ts`
5. Добавьте переменные окружения из `bot/.env`
6. Деплой произойдет автоматически
7. Скопируйте URL (например: `https://easybooking-bot.up.railway.app`)
8. Используйте этот URL в `VITE_BOT_API_URL` на Vercel

#### Вариант 2: Render

1. Зарегистрируйтесь на https://render.com
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройте:
   - **Root Directory:** `bot`
   - **Build Command:** `bun install`
   - **Start Command:** `bun run src/index.ts`
5. Добавьте переменные окружения
6. Деплой произойдет автоматически

#### Вариант 3: VPS (для продвинутых)

Если у вас есть VPS:

```bash
# На сервере
git clone https://github.com/Peternub/easybooking.git
cd easybooking/bot
bun install

# Создайте .env файл с вашими переменными
nano .env

# Запустите с помощью PM2
bun add -g pm2
pm2 start "bun run src/index.ts" --name easybooking-bot
pm2 save
pm2 startup
```

## Локальная разработка

Для локальной разработки бот работает на `http://localhost:3001`.

1. Запустите бота:
```powershell
cd bot
bun run dev
```

2. Запустите webapp:
```powershell
cd webapp
bun run dev
```

3. Откройте Mini App в Telegram и протестируйте создание записи

## Проверка работы

После деплоя:

1. Откройте бота в Telegram
2. Нажмите кнопку "Записаться"
3. Выберите услугу, мастера, дату и время
4. Нажмите "Записаться"
5. Mini App должен закрыться
6. Вы должны получить сообщение от бота с подтверждением
7. Админ (ID: 7766545820) должен получить уведомление о новой записи

## Troubleshooting

### Уведомления не приходят

1. Проверьте логи бота на платформе деплоя
2. Проверьте что `VITE_BOT_API_URL` правильно настроен на Vercel
3. Проверьте что бот не заблокирован пользователем
4. Проверьте что `TELEGRAM_ADMIN_ID` правильный в `.env` бота

### Ошибка CORS

Если видите ошибку CORS в консоли браузера:
- Проверьте что бот запущен и доступен
- CORS headers уже настроены в `bot/src/index.ts`

### Бот не запускается

1. Проверьте что все переменные окружения настроены
2. Проверьте логи на платформе деплоя
3. Убедитесь что используется Bun runtime
