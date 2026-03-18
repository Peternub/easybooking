// Главный файл Telegram бота

import { Bot, webhookCallback } from 'grammy';
import { handleNotifyBooking } from './api/notify-booking.js';
import { handleNotifyCancellation } from './api/notify-cancellation.js';
import { handleSubmitReview } from './api/submit-review.js';
import { handleValidatePromo } from './api/validate-promo.js';
import { config, validateConfig } from './config.js';
import { setupHandlers } from './handlers/index.js';
import { startNotificationScheduler } from './notifications/scheduler.js';
import { getMasterById, getMastersByService, getServices, getServiceById } from './services/supabase.js';

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

      // Endpoint для проверки промокода
      if (url.pathname === '/api/validate-promo' && req.method === 'POST') {
        try {
          const data = await req.json();
          console.log('🎫 Получен запрос на проверку промокода');

          const result = await handleValidatePromo(data);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Ошибка проверки промокода:', error);
          return new Response(JSON.stringify({ valid: false, message: 'Ошибка сервера' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Endpoint для уведомления об отмене записи
      if (url.pathname === '/api/submit-review' && req.method === 'POST') {
        try {
          const data = await req.json();
          console.log('Получен запрос на сохранение отзыва');

          const result = await handleSubmitReview(data);

          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Ошибка сохранения отзыва:', error);
          return new Response(
            JSON.stringify({ success: false, message: 'Не удалось сохранить отзыв' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }
      }

      if (url.pathname === '/api/notify-cancellation' && req.method === 'POST') {
        try {
          const data = await req.json();
          console.log('📢 Получен запрос на отправку уведомления об отмене');

          await handleNotifyCancellation(bot, data);

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('❌ Ошибка отправки уведомления об отмене:', error);
          return new Response(JSON.stringify({ success: false, error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (url.pathname === '/api/services' && req.method === 'GET') {
        try {
          const services = await getServices();

          return new Response(JSON.stringify(services), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ message: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (url.pathname.startsWith('/api/services/') && req.method === 'GET') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const serviceId = pathParts[2];
        const subResource = pathParts[3];

        try {
          if (subResource === 'masters') {
            const masters = await getMastersByService(serviceId);

            return new Response(JSON.stringify(masters), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const service = await getServiceById(serviceId);

          return new Response(JSON.stringify(service), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ message: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (url.pathname.startsWith('/api/masters/') && req.method === 'GET') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const masterId = pathParts[2];

        try {
          const master = await getMasterById(masterId);

          return new Response(JSON.stringify(master), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ message: String(error) }), {
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
