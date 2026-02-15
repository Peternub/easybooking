// Обработчик просмотра записей

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getClientBookings } from '../services/supabase.js';

export async function handleMyBookings(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const bookings = await getClientBookings(userId);

    if (bookings.length === 0) {
      await ctx.reply(
        'У вас пока нет записей. Нажмите "Записаться на услугу" чтобы создать запись.',
      );
      return;
    }

    const activeBookings = bookings.filter((b) => b.status === 'active');
    const pastBookings = bookings.filter((b) => b.status !== 'active');

    let message = '📋 Ваши записи:\n\n';

    if (activeBookings.length > 0) {
      message += '✅ Активные записи:\n\n';
      for (const booking of activeBookings) {
        const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
        message += `📅 ${date} в ${booking.booking_time}\n`;
        message += `👤 Мастер: ${booking.master.name}\n`;
        message += `💇 Услуга: ${booking.service.name}\n`;
        message += `💰 Стоимость: ${booking.service.price} ₽\n`;
        message += `⏱ Длительность: ${booking.service.duration_minutes} мин\n\n`;
      }
    }

    if (pastBookings.length > 0) {
      message += '\n📜 История:\n\n';
      for (const booking of pastBookings.slice(0, 5)) {
        const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
        const statusEmoji =
          {
            completed: '✅',
            cancelled_by_client: '❌',
            cancelled_by_admin: '🚫',
          }[booking.status] || '❓';

        message += `${statusEmoji} ${date} - ${booking.service.name}\n`;
      }
    }

    const keyboard = new InlineKeyboard();
    for (const booking of activeBookings) {
      const date = format(new Date(booking.booking_date), 'd MMM', { locale: ru });
      keyboard.text(`❌ Отменить запись ${date}`, `cancel_booking:${booking.id}`).row();
    }

    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    console.error('Ошибка получения записей:', error);
    await ctx.reply('Произошла ошибка при получении списка записей. Попробуйте позже.');
  }
}
