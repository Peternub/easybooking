// Обработчик команды /start

import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { isAdmin } from '../services/data.js';

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
    .webApp('📱 Записаться на услугу', config.app.webappUrl)
    .row()
    .text('📋 Мои записи', 'my_bookings');

  if (userIsAdmin) {
    keyboard
      .row()
      .webApp('📅 Записи', `${config.app.webappUrl}/admin-bookings`)
      .row()
      .webApp('👥 Мастера', `${config.app.webappUrl}/admin-masters`)
      .row()
      .webApp('💼 Услуги', `${config.app.webappUrl}/admin-services`)
      .row()
      .webApp('⭐ Отзывы', `${config.app.webappUrl}/admin-reviews`);
  }

  await ctx.reply(message, { reply_markup: keyboard });
}
