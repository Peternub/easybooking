import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CallbackQueryContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { cancelBooking, getBookingById } from '../services/supabase.js';

async function replaceOrReply(ctx: CallbackQueryContext<Context>, text: string, keyboard?: InlineKeyboard) {
  try {
    await ctx.editMessageText(text, keyboard ? { reply_markup: keyboard } : undefined);
  } catch {
    await ctx.reply(text, keyboard ? { reply_markup: keyboard } : undefined);
  }
}

export async function handleCancelBooking(ctx: CallbackQueryContext<Context>) {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from?.id;

  if (!data || !userId) {
    return;
  }

  await ctx.answerCallbackQuery().catch(() => undefined);

  try {
    if (data.startsWith('cancel_booking:')) {
      const bookingId = data.split(':')[1];
      const booking = await getBookingById(bookingId);

      if (!booking) {
        await ctx.reply('Запись не найдена.');
        return;
      }

      if (String(booking.client_telegram_id) !== String(userId)) {
        await ctx.reply('Это не ваша запись.');
        return;
      }

      if (booking.status !== 'active') {
        await replaceOrReply(ctx, 'Эта запись уже отменена или недоступна.');
        return;
      }

      const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
      const keyboard = new InlineKeyboard()
        .text('Да, отменить', `confirm_cancel:${bookingId}`)
        .text('Нет, оставить', 'cancel_action');

      await replaceOrReply(
        ctx,
        `Вы уверены, что хотите отменить запись?\n\nДата: ${date}\nВремя: ${booking.booking_time}\nМастер: ${booking.master.name}\nУслуга: ${booking.service.name}`,
        keyboard,
      );

      return;
    }

    if (data.startsWith('confirm_cancel:')) {
      const bookingId = data.split(':')[1];
      const booking = await getBookingById(bookingId);

      if (!booking) {
        await ctx.reply('Запись не найдена.');
        return;
      }

      if (String(booking.client_telegram_id) !== String(userId)) {
        await ctx.reply('Это не ваша запись.');
        return;
      }

      if (booking.status !== 'active') {
        await replaceOrReply(ctx, 'Эта запись уже отменена.');
        return;
      }

      await cancelBooking(bookingId, 'client');

      try {
        const date = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `Клиент отменил запись:\n\nКлиент: ${booking.client_name}\nДата: ${date}\nВремя: ${booking.booking_time}\nУслуга: ${booking.service.name}\nМастер: ${booking.master.name}`,
        );
      } catch (error) {
        console.error('Ошибка уведомления администратора:', error);
      }

      await replaceOrReply(
        ctx,
        'Запись успешно отменена.\n\nЕсли захотите записаться снова, используйте кнопку "Записаться на услугу".',
      );

      return;
    }

    if (data === 'cancel_action') {
      await replaceOrReply(ctx, 'Отмена действия.');
    }
  } catch (error) {
    console.error('Ошибка отмены записи:', error);
    await ctx.reply('Не удалось отменить запись. Попробуйте ещё раз.');
  }
}
