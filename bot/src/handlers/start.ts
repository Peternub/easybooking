// Обработчик команды /start

import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { isAdmin } from '../services/data.js';

function buildWebAppUrl(path = ''): string {
  const normalizedBase = config.app.webappUrl.endsWith('/')
    ? config.app.webappUrl
    : `${config.app.webappUrl}/`;
  const url = new URL(path.replace(/^\//, ''), normalizedBase);
  url.searchParams.set('v', String(Date.now()));
  return url.toString();
}

export async function handleStart(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const userIsAdmin = await isAdmin(userId);

  const message =
    'Добро пожаловать в систему бронирования! 👋\n\n' +
    'Здесь вы можете:\n' +
    '• Записаться на услугу\n' +
    '• Просмотреть свои записи\n' +
    '• Отменить запись\n' +
    '• Оставить отзыв после посещения';

  // Используем webApp кнопку для получения данных через sendData()
  const keyboard = new InlineKeyboard()
    .webApp('📱 Записаться на услугу', buildWebAppUrl())
    .row()
    .text('📋 Мои записи', 'my_bookings');

  if (userIsAdmin) {
    keyboard
      .row()
      .webApp('📅 Записи', buildWebAppUrl('/admin-bookings'))
      .row()
      .webApp('👥 Мастера', buildWebAppUrl('/admin-masters'))
      .row()
      .webApp('💼 Услуги', buildWebAppUrl('/admin-services'))
      .row()
      .webApp('⭐ Отзывы', buildWebAppUrl('/admin-reviews'));
  }

  await ctx.reply(message, { reply_markup: keyboard });
}
