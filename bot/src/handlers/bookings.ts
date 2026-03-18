// Обработчик просмотра записей

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getClientBookings } from '../services/data.js';

export async function handleMyBookings(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const bookings = await getClientBookings(userId);

    // Фильтруем только активные записи, которые еще не прошли
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm:ss');

    const upcomingBookings = bookings.filter((b) => {
      if (b.status !== 'active') return false;
      
      // Если дата больше сегодняшней - показываем
      if (b.booking_date > today) return true;
      
      // Если дата сегодняшняя - проверяем время
      if (b.booking_date === today && b.booking_time > currentTime) return true;
      
      return false;
    });

    if (upcomingBookings.length === 0) {
      await ctx.reply(
        'У вас нет предстоящих записей. Нажмите "Записаться на услугу" чтобы создать запись.',
      );
      return;
    }

    let message = '📋 Ваши предстоящие записи:\n\n';

    for (const booking of upcomingBookings) {
      const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
      message += `📅 ${date} в ${booking.booking_time.substring(0, 5)}\n`;
      message += `👤 Мастер: ${booking.master.name}\n`;
      message += `💇 Услуга: ${booking.service.name}\n`;
      message += `💰 Стоимость: ${booking.final_price} ₽\n`;
      message += `⏱ Длительность: ${booking.service.duration_minutes} мин\n\n`;
    }

    const keyboard = new InlineKeyboard();
    for (const booking of upcomingBookings) {
      const date = format(new Date(booking.booking_date), 'd MMM', { locale: ru });
      keyboard.text(`❌ Отменить запись ${date}`, `cancel_booking:${booking.id}`).row();
    }

    await ctx.reply(message, { reply_markup: keyboard });
  } catch (error) {
    console.error('Ошибка получения записей:', error);
    await ctx.reply('Произошла ошибка при получении списка записей. Попробуйте позже.');
  }
}
