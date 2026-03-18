// Обработчик данных из Web App

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Context } from 'grammy';
import { config } from '../config.js';
import {
  createBooking,
  createReview,
  getBookingById,
  getMasterById,
  getServiceById,
} from '../services/data.js';

interface BookingData {
  type: 'booking';
  serviceId: string;
  masterId: string;
  date: string;
  time: string;
}

interface ReviewData {
  type: 'review';
  bookingId: string;
  rating: number;
  comment: string;
}

export async function handleWebApp(ctx: Context) {
  console.log('=== ПОЛУЧЕНЫ ДАННЫЕ ИЗ WEB APP ===');
  console.log('Полный контекст сообщения:', JSON.stringify(ctx.message, null, 2));

  const webAppData = ctx.message?.web_app_data?.data;
  console.log('web_app_data:', webAppData);

  if (!webAppData) {
    console.error('Нет данных web_app_data');
    return;
  }

  const userId = ctx.from?.id;
  const userName = ctx.from?.first_name || 'Клиент';
  const username = ctx.from?.username;

  if (!userId) {
    console.error('Нет userId');
    return;
  }

  try {
    const data = JSON.parse(webAppData) as BookingData | ReviewData;
    console.log('Распарсенные данные:', data);

    if (data.type === 'booking') {
      const { serviceId, masterId, date, time } = data;

      const [master, service] = await Promise.all([
        getMasterById(masterId),
        getServiceById(serviceId),
      ]);

      const booking = await createBooking({
        client_telegram_id: userId,
        client_name: userName,
        client_phone: null,
        client_username: username || null,
        client_id: null,
        master_id: masterId,
        service_id: serviceId,
        booking_date: date,
        booking_time: time,
        status: 'active',
        source: 'online',
        cancellation_reason: null,
        google_event_id: null,
        original_price: service.price,
        discount_amount: 0,
        final_price: service.price,
        promo_code: null,
        admin_notes: null,
        reminder_24h_sent_at: null,
        reminder_1h_sent_at: null,
        review_request_sent_at: null,
      });

      console.log('Запись создана:', booking.id);

      const dateFormatted = format(new Date(date), 'd MMMM yyyy', { locale: ru });

      await ctx.reply(
        `✅ Запись успешно создана!\n\n📅 Дата: ${dateFormatted}\n⏰ Время: ${time}\n👤 Мастер: ${master.name}\n💇 Услуга: ${service.name}\n💰 Стоимость: ${service.price} ₽\n⏱ Длительность: ${service.duration_minutes} мин\n\nМы отправим вам напоминание за 24 часа и за 1 час до визита.`,
      );

      try {
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `✅ Новая запись!\n\n👤 Клиент: ${userName} ${username ? `(@${username})` : ''}\n📅 Дата: ${dateFormatted}\n⏰ Время: ${time}\n💇 Услуга: ${service.name}\n👨‍💼 Мастер: ${master.name}\n💰 Стоимость: ${service.price} ₽`,
        );
      } catch (error) {
        console.error('Ошибка уведомления администратора:', error);
      }
    }

    if (data.type === 'review') {
      const { bookingId, rating, comment } = data;
      const booking = await getBookingById(bookingId);

      if (booking.client_telegram_id !== userId) {
        await ctx.reply('Ошибка: это не ваша запись');
        return;
      }

      try {
        await createReview({
          booking_id: bookingId,
          client_telegram_id: userId,
          master_id: booking.master_id,
          service_id: booking.service_id,
          rating,
          comment: comment || null,
        });
      } catch (reviewError) {
        console.error('Ошибка сохранения отзыва:', reviewError);
        await ctx.reply('Не удалось сохранить отзыв. Попробуйте еще раз позже.');
        return;
      }

      await ctx.reply(
        `⭐️ Спасибо за ваш отзыв!\n\nВаша оценка: ${'⭐️'.repeat(rating)}\n\nМы ценим ваше мнение и будем рады видеть вас снова!`,
      );

      try {
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `⭐️ Новый отзыв!\n\n👤 Клиент: ${userName}\n💇 Услуга: ${booking.service.name}\n👨‍💼 Мастер: ${booking.master.name}\nОценка: ${'⭐️'.repeat(rating)}\n${comment ? `\nКомментарий: ${comment}` : ''}`,
        );
      } catch (error) {
        console.error('Ошибка уведомления администратора:', error);
      }
    }
  } catch (error) {
    console.error('Ошибка обработки данных WEB APP:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    await ctx.reply('Произошла ошибка. Попробуйте еще раз или обратитесь к администратору.');
  }
}
