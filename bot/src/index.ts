import { Bot } from 'grammy';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getAvailableDates, getAvailableSlots } from './api/availability.js';
import { handleCreateAdminBooking } from './api/create-admin-booking.js';
import { handleCreateBooking } from './api/create-booking.js';
import { handleNotifyBooking } from './api/notify-booking.js';
import { handleNotifyCancellation } from './api/notify-cancellation.js';
import { handleSubmitReview } from './api/submit-review.js';
import { handleValidatePromo } from './api/validate-promo.js';
import { config, validateConfig } from './config.js';
import { setupHandlers } from './handlers/index.js';
import { startNotificationScheduler } from './notifications/scheduler.js';
import {
  addServiceToMaster,
  createMasterAbsence,
  createMaster,
  createService,
  deleteMasterAbsence,
  getAdminBookings,
  getAdminClients,
  getAdminMasters,
  getAdminReviews,
  getAdminServices,
  getMasterById,
  getMasterAbsences,
  getMasterWorkSchedule,
  getServicesByMaster,
  getMastersByService,
  getServices,
  getServiceById,
  isAdmin,
  removeServiceFromMaster,
  toggleMasterActive,
  toggleServiceActive,
  updateMaster,
  updateMasterWorkSchedule,
  updateService,
} from './services/data.js';

declare const Bun: any;

const uploadsRoot = resolve(process.cwd(), 'uploads');
const masterUploadsDir = join(uploadsRoot, 'masters');

mkdirSync(masterUploadsDir, { recursive: true });

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

function getFileExtension(fileName: string) {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() || 'jpg' : 'jpg';
}

function buildUploadUrl(origin: string, fileName: string) {
  return `${origin}/uploads/masters/${fileName}`;
}

function getUploadFilePath(fileName: string) {
  return join(masterUploadsDir, fileName);
}

function startApiServer(bot: Bot) {
  const port = process.env.API_PORT || 3001;

  Bun.serve({
    port: Number(port),
    async fetch(req: any) {
      const url = new URL(req.url);

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (url.pathname.startsWith('/uploads/')) {
        const relativePath = url.pathname.replace(/^\/uploads\//, '');
        const fullPath = resolve(uploadsRoot, relativePath);

        if (!fullPath.startsWith(uploadsRoot)) {
          return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }

        const file = Bun.file(fullPath);
        if (!(await file.exists())) {
          return new Response('Not Found', { status: 404, headers: corsHeaders });
        }

        return new Response(file, { status: 200, headers: corsHeaders });
      }

      if (url.pathname === '/api/upload/master-photo' && req.method === 'POST') {
        try {
          const formData = await req.formData();
          const file = formData.get('file');

          if (!(file instanceof File)) {
            return jsonResponse({ message: 'Файл не передан' }, 400, corsHeaders);
          }

          if (!file.type.startsWith('image/')) {
            return jsonResponse({ message: 'Можно загружать только изображения' }, 400, corsHeaders);
          }

          if (file.size > 5 * 1024 * 1024) {
            return jsonResponse({ message: 'Файл слишком большой' }, 400, corsHeaders);
          }

          const extension = getFileExtension(file.name);
          const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
          const filePath = getUploadFilePath(fileName);

          await Bun.write(filePath, file);

          return jsonResponse(
            {
              url: buildUploadUrl(url.origin, fileName),
            },
            200,
            corsHeaders,
          );
        } catch (error) {
          console.error('Ошибка загрузки фото мастера:', error);
          return jsonResponse({ message: 'Не удалось загрузить фото' }, 500, corsHeaders);
        }
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

      if (url.pathname === '/api/admin/services' && req.method === 'GET') {
        try {
          const services = await getAdminServices();
          return jsonResponse(services, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/access' && req.method === 'POST') {
        try {
          const data = await req.json();
          const telegramId = Number(data?.telegramId);

          if (!telegramId) {
            return jsonResponse({ isAdmin: false, message: 'Не передан Telegram ID' }, 400, corsHeaders);
          }

          const adminAccess = await isAdmin(telegramId);
          return jsonResponse({ isAdmin: adminAccess }, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка проверки доступа в админку:', error);
          return jsonResponse({ isAdmin: false, message: 'Не удалось проверить доступ' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/services' && req.method === 'POST') {
        try {
          const data = await req.json();
          const service = await createService(data);
          return jsonResponse(service, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка создания услуги:', error);
          return jsonResponse({ message: 'Не удалось создать услугу' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/masters' && req.method === 'GET') {
        try {
          const masters = await getAdminMasters();
          return jsonResponse(masters, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: String(error) }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/masters' && req.method === 'POST') {
        try {
          const data = await req.json();
          const master = await createMaster(data);
          return jsonResponse(master, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка создания мастера:', error);
          return jsonResponse({ message: 'Не удалось создать мастера' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/reviews' && req.method === 'GET') {
        try {
          const reviews = await getAdminReviews();
          return jsonResponse(reviews, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка загрузки отзывов:', error);
          return jsonResponse({ message: 'Не удалось загрузить отзывы' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/clients' && req.method === 'GET') {
        try {
          const clients = await getAdminClients();
          return jsonResponse(clients, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка загрузки клиентов:', error);
          return jsonResponse({ message: 'Не удалось загрузить клиентов' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/bookings' && req.method === 'POST') {
        try {
          const data = await req.json();
          const result = await handleCreateAdminBooking(data);
          return jsonResponse(
            result.success ? { success: true, bookingId: result.bookingId } : { success: false, message: result.message },
            result.status,
            corsHeaders,
          );
        } catch (error) {
          console.error('Ошибка создания записи из админки:', error);
          return jsonResponse({ success: false, message: 'Не удалось создать запись' }, 500, corsHeaders);
        }
      }

      if (url.pathname === '/api/admin/bookings' && req.method === 'GET') {
        try {
          const fromDate = String(url.searchParams.get('from') || '');
          const toDate = String(url.searchParams.get('to') || '');
          const statuses = (url.searchParams.get('statuses') || 'active,pending')
            .split(',')
            .filter(Boolean) as Array<'active' | 'pending' | 'completed' | 'cancelled' | 'no_show'>;

          if (!fromDate || !toDate) {
            return jsonResponse({ message: 'Не передан диапазон дат' }, 400, corsHeaders);
          }

          const bookings = await getAdminBookings(fromDate, toDate, statuses);
          return jsonResponse(bookings, 200, corsHeaders);
        } catch (error) {
          console.error('Ошибка загрузки записей:', error);
          return jsonResponse({ message: 'Не удалось загрузить записи' }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/admin/services/') && (req.method === 'PATCH' || req.method === 'POST')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const serviceId = pathParts[3];
        const subResource = pathParts[4];

        try {
          if (subResource === 'toggle-active' && req.method === 'POST') {
            const data = await req.json();
            const service = await toggleServiceActive(serviceId, Boolean(data?.is_active));
            return jsonResponse(service, 200, corsHeaders);
          }

          if (!subResource && req.method === 'PATCH') {
            const data = await req.json();
            const service = await updateService(serviceId, data);
            return jsonResponse(service, 200, corsHeaders);
          }

          return jsonResponse({ message: 'Not Found' }, 404, corsHeaders);
        } catch (error) {
          console.error('Ошибка обновления услуги:', error);
          return jsonResponse({ message: 'Не удалось обновить услугу' }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/admin/masters/') && req.method === 'GET') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const masterId = pathParts[3];
        const subResource = pathParts[4];

        try {
          if (subResource === 'services') {
            const services = await getServicesByMaster(masterId);
            return jsonResponse(services, 200, corsHeaders);
          }

          if (subResource === 'work-schedule') {
            const workSchedule = await getMasterWorkSchedule(masterId);
            return jsonResponse(workSchedule, 200, corsHeaders);
          }

          if (subResource === 'absences') {
            const absences = await getMasterAbsences(masterId);
            return jsonResponse(absences, 200, corsHeaders);
          }

          return jsonResponse({ message: 'Not Found' }, 404, corsHeaders);
        } catch (error) {
          console.error('Ошибка загрузки данных мастера:', error);
          return jsonResponse({ message: 'Не удалось загрузить данные мастера' }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/admin/masters/') && (req.method === 'PATCH' || req.method === 'POST')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const masterId = pathParts[3];
        const subResource = pathParts[4];

        try {
          if (subResource === 'services' && req.method === 'POST') {
            const data = await req.json();
            await addServiceToMaster(masterId, String(data?.service_id));
            return jsonResponse({ success: true }, 200, corsHeaders);
          }

          if (subResource === 'absences' && req.method === 'POST') {
            const data = await req.json();
            const absence = await createMasterAbsence(masterId, {
              start_date: String(data?.start_date || ''),
              end_date: String(data?.end_date || ''),
              reason: data?.reason || 'vacation',
              notes: data?.notes || null,
            });
            return jsonResponse(absence, 200, corsHeaders);
          }

          if (subResource === 'work-schedule' && req.method === 'PATCH') {
            const data = await req.json();
            const master = await updateMasterWorkSchedule(masterId, data?.work_schedule || {});
            return jsonResponse(master, 200, corsHeaders);
          }

          if (subResource === 'toggle-active' && req.method === 'POST') {
            const data = await req.json();
            const master = await toggleMasterActive(masterId, Boolean(data?.is_active));
            return jsonResponse(master, 200, corsHeaders);
          }

          if (!subResource && req.method === 'PATCH') {
            const data = await req.json();
            const master = await updateMaster(masterId, data);
            return jsonResponse(master, 200, corsHeaders);
          }

          return jsonResponse({ message: 'Not Found' }, 404, corsHeaders);
        } catch (error) {
          console.error('Ошибка обновления мастера:', error);
          return jsonResponse({ message: 'Не удалось обновить мастера' }, 500, corsHeaders);
        }
      }

      if (url.pathname.startsWith('/api/admin/masters/') && req.method === 'DELETE') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        const masterId = pathParts[3];
        const subResource = pathParts[4];
        const serviceId = pathParts[5];
        const absenceId = pathParts[5];

        try {
          if (subResource === 'services' && serviceId) {
            await removeServiceFromMaster(masterId, serviceId);
            return jsonResponse({ success: true }, 200, corsHeaders);
          }

          if (subResource === 'absences' && absenceId) {
            await deleteMasterAbsence(absenceId);
            return jsonResponse({ success: true }, 200, corsHeaders);
          }

          return jsonResponse({ message: 'Not Found' }, 404, corsHeaders);
        } catch (error) {
          console.error('Ошибка удаления данных мастера:', error);
          return jsonResponse({ message: 'Не удалось удалить данные мастера' }, 500, corsHeaders);
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
