// Обработчик отмены записи

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CallbackQueryContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { cancelBooking, getBookingById } from '../services/supabase.js';

export async function handleCancelBooking(ctx: CallbackQueryContext<Context>) {
  const data = ctx.callbackQuery.data;
  if (!data) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    if (data.startsWith('cancel_booking:')) {
      const bookingId = data.split(':')[1];
      const booking = await getBookingById(bookingId);

      if (booking.client_telegram_id !== userId) {
        await ctx.answerCallbackQuery('Это не ваша запись');
        return;
      }

      if (booking.status !== 'active') {
        await ctx.answerCallbackQuery('Эта запись уже отменена');
        return;
      }

      const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });

      const keyboard = new InlineKeyboard()
        .text('✅ Да, отменить', `confirm_cancel:${bookingId}`)
        .text('❌ Нет, оставить', 'cancel_action');

      await ctx.editMessageText(
        `Вы уверены, что хотите отменить запись?\n\n📅 Дата: ${date}\n⏰ Время: ${booking.booking_time}\n👤 Мастер: ${booking.master.name}\n💇 Услуга: ${booking.service.name}`,
        { reply_markup: keyboard },
      );

      await ctx.answerCallbackQuery();
      return;
    }

    if (data.startsWith('confirm_cancel:')) {
      const bookingId = data.split(':')[1];
      const booking = await getBookingById(bookingId);

      if (booking.client_telegram_id !== userId) {
        await ctx.answerCallbackQuery('Это не ваша запись');
        return;
      }

      await cancelBooking(bookingId, 'client');

      try {
        const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `❌ Клиент отменил запись:\n\n👤 Клиент: ${booking.client_name}\n📅 Дата: ${date}\n⏰ Время: ${booking.booking_time}\n💇 Услуга: ${booking.service.name}\n👨‍💼 Мастер: ${booking.master.name}`,
        );
      } catch (error) {
        console.error('Ошибка уведомления администратора:', error);
      }

      await ctx.editMessageText(
        '✅ Запись успешно отменена.\n\nЕсли хотите записаться снова, используйте кнопку "Записаться на услугу".',
      );

      await ctx.answerCallbackQuery('Запись отменена');
      return;
    }

    if (data === 'cancel_action') {
      await ctx.editMessageText('Действие отменено');
      await ctx.answerCallbackQuery();
      return;
    }
  } catch (error) {
    console.error('Ошибка отмены записи:', error);
    await ctx.answerCallbackQuery('Произошла ошибка. Попробуйте позже.');
  }
}
