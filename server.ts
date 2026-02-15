// Единый сервер для бота и webapp
import { Bot } from 'grammy';
import { handleNotifyBooking } from './bot/src/api/notify-booking.js';
import { config, validateConfig } from './bot/src/config.js';
import { setupHandlers } from './bot/src/handlers/index.js';
import { startNotificationScheduler } from './bot/src/notifications/scheduler.js';

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

// Запуск бота
console.log('🤖 Запуск бота...');
bot.start({
  onStart: () => {
    console.log('✅ Бот успешно запущен!');
    console.log(`📱 Бот: @${bot.botInfo.username}`);
    startNotificationScheduler(bot);
  },
});

// Единый HTTP сервер для webapp и API
const port = process.env.PORT || 3000;

Bun.serve({
  port: Number(port),
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // API endpoint для уведомлений
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

    // Раздача статических файлов webapp
    try {
      const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
      const file = Bun.file(`./webapp/dist${filePath}`);

      if (await file.exists()) {
        return new Response(file, { headers: corsHeaders });
      }

      // Для SPA - всегда возвращаем index.html
      const indexFile = Bun.file('./webapp/dist/index.html');
      return new Response(indexFile, { headers: corsHeaders });
    } catch (error) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
  },
});

console.log(`🌐 Сервер запущен на порту ${port}`);
console.log(`📍 Webapp: http://localhost:${port}`);
console.log(`📍 API: http://localhost:${port}/api/notify-booking`);

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹️  Остановка сервера...');
  bot.stop();
  process.exit(0);
});
process.once('SIGTERM', () => {
  console.log('\n⏹️  Остановка сервера...');
  bot.stop();
  process.exit(0);
});
