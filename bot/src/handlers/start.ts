// Обработчик команды /start

import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { isAdmin } from '../services/supabase.js';

export async function handleStart(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const userIsAdmin = await isAdmin(userId);

  let message = `Добро пожаловать в систему бронирования! 👋\n\n` +
    `Здесь вы можете:\n` +
    `• Записаться на услугу\n` +
    `• Просмотреть свои записи (команда /mybookings)\n` +
    `• Отменить запись\n` +
    `• Оставить отзыв после посещения\n\n` +
    `🌐 Веб-приложение: ${config.app.webappUrl}`;

  if (userIsAdmin) {
    message += `\n\n⚙️ Админ-панель: ${config.app.webappUrl}/admin`;
  }

  await ctx.reply(message);
}
