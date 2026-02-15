// Главный файл Telegram бота

import { Bot, webhookCallback } from 'grammy';
import { handleNotifyBooking } from './api/notify-booking.js';
import { config, validateConfig } from './config.js';
import { setupHandlers } from './handlers/index.js';
import { startNotificationScheduler } from './notifications/scheduler.js';

// Валидация конфигурации
try {
  validateConfig();
} catch (error) {
  console.error('Ошибка конфигурации:', error);
  process.exit(1);
}

// Создание бота
const bot = new Bot(config.telegram.botToken);

// Настройка обработчиков
setupHandlers(bot);

// Обработка ошибок
bot.catch((err) => {
  console.error('Ошибка в боте:', err);
});

// Development: используем long polling
console.log('🤖 Бот запускается в режиме разработки...');

bot.start({
  onStart: () => {
    console.log('✅ Бот успешно запущен!');
    console.log(`📱 Бот: @${bot.botInfo.username}`);

    // Запускаем планировщик уведомлений
    startNotificationScheduler(bot);

    // Запускаем API сервер
    startApiServer(bot);
  },
});

// API сервер для уведомлений
function startApiServer(bot: Bot) {
  const port = process.env.API_PORT || 3001;

  Bun.serve({
    port: Number(port),
    async fetch(req) {
      const url = new URL(req.url);

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Handle preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Endpoint для уведомлений о записи
      if (url.pathname === '/api/notify-booking' && req.method === 'POST') {
        try {
          const data = await req.json();
          console.log('📨 Получен запрос на отправку уведомлений');

          await handleNotifyBooking(bot, data);

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Ошибка обработки запроса:', error);
          return new Response(JSON.stringify({ success: false, error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Health check
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
  });

  console.log(`🌐 API сервер запущен на порту ${port}`);
  console.log(`📍 API URL: http://localhost:${port}/api/notify-booking`);
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹️  Остановка бота...');
  bot.stop();
  process.exit(0);
});
process.once('SIGTERM', () => {
  console.log('\n⏹️  Остановка бота...');
  bot.stop();
  process.exit(0);
});

export { bot };
