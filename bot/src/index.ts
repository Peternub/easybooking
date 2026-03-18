import { Bot } from 'grammy';
import { getAvailableDates, getAvailableSlots } from './api/availability.js';
import { handleCreateBooking } from './api/create-booking.js';
import { handleNotifyBooking } from './api/notify-booking.js';
import { handleNotifyCancellation } from './api/notify-cancellation.js';
import { handleSubmitReview } from './api/submit-review.js';
import { handleValidatePromo } from './api/validate-promo.js';
import { config, validateConfig } from './config.js';
import { setupHandlers } from './handlers/index.js';
import { startNotificationScheduler } from './notifications/scheduler.js';
import { getMasterById, getMastersByService, getServices, getServiceById } from './services/supabase.js';

declare const Bun: any;

try {
  validateConfig();
} catch (error) {
  console.error('Ошибка конфигурации:', error);
  process.exit(1);
}

const bot = new Bot(config.telegram.botToken);

setupHandlers(bot);

bot.catch((err) => {
  console.error('Ошибка в боте:', err);
});

console.log('Бот запускается в режиме разработки...');

bot.start({
  onStart: () => {
    console.log('Бот успешно запущен');
    console.log(`Бот: @${bot.botInfo.username}`);

    startNotificationScheduler(bot);
    startApiServer(bot);
  },
});

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function startApiServer(bot: Bot) {
  const port = process.env.API_PORT || 3001;

  Bun.serve({
    port: Number(port),
    async fetch(req: any) {
      const url = new URL(req.url);

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (url.pathname === '/api/bookings' && req.method === 'POST') {
        try {
          const data = await req.json();
          const result = await handleCreateBooking(bot, data);
          return jsonResponse(result, result.success ? 200 : 400, corsHeaders);
        } catch (error) {
          console.error('Ошибка создания записи:', error);
          return jsonResponse({ success: false, message: 'Не удалось создать запись' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/notify-booking' && req.method === 'POST') {
        try {
          const data = await req.json();
          await handleNotifyBooking(bot, data);
          return jsonResponse({ success: true }, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка обработки запроса:', error);
          return jsonResponse({ success: false, error: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/validate-promo' && req.method === 'POST') {
        try {
          const data = await req.json();
          const result = await handleValidatePromo(data);
          return jsonResponse(result, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка проверки промокода:', error);
          return jsonResponse({ valid: false, message: 'Ошибка сервера' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/submit-review' && req.method === 'POST') {
        try {
          const data = await req.json();
          const result = await handleSubmitReview(data);
          return jsonResponse(result, result.success ? 200 : 400, corsHeaders);
        } catch (error) {
          console.error('Ошибка сохранения отзыва:', error);
          return jsonResponse({ success: false, message: 'Не удалось сохранить отзыв' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/notify-cancellation' && req.method === 'POST') {
        try {
          const data = await req.json();
          await handleNotifyCancellation(bot, data);
          return jsonResponse({ success: true }, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка отправки уведомления об отмене:', error);
          return jsonResponse({ success: false, error: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/services' && req.method === 'GET') {
        try {
          const services = await getServices();
          return jsonResponse(services, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/services/') && req.method === 'GET') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const serviceId = pathParts[2];
        const subResource = pathParts[3];

        try {
          if (subResource === 'masters') {
            const masters = await getMastersByService(serviceId);
            return jsonResponse(masters, 200, corsHeaders);
          }

          const service = await getServiceById(serviceId);
          return jsonResponse(service, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/masters/') && req.method === 'GET') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const masterId = pathParts[2];
        const subResource = pathParts[3];

        try {
          if (subResource === 'available-dates') {
            const dates = await getAvailableDates(masterId);
            return jsonResponse(dates, 200, corsHeaders);
          }

          if (subResource === 'available-slots') {
            const date = url.searchParams.get('date');
            if (!date) {
              return jsonResponse({ message: 'Не передана дата' }, 400, corsHeaders);
            }

            const slots = await getAvailableSlots(masterId, date);
            return jsonResponse(slots, 200, corsHeaders);
          }

          const master = await getMasterById(masterId);
          return jsonResponse(master, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/health') {
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
  });

  console.log(`API сервер запущен на порту ${port}`);
}

process.once('SIGINT', () => {
  console.log('\nОстановка бота...');
  bot.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\nОстановка бота...');
  bot.stop();
  process.exit(0);
});

export { bot };
