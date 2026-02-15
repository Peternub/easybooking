// Обработчик данных из Web App

import type { Context } from 'grammy';
import { createBooking, getMasterById, getServiceById, createReview, getBookingById } from '../services/supabase.js';
import { createCalendarEvent } from '../services/google-calendar.js';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { config } from '../config.js';

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
    console.error('❌ Нет данных web_app_data');
    return;
  }

  const userId = ctx.from?.id;
  const userName = ctx.from?.first_name || 'Клиент';
  const username = ctx.from?.username;

  console.log('User ID:', userId);
  console.log('User Name:', userName);

  if (!userId) {
    console.error('❌ Нет userId');
    return;
  }

  try {
    const data = JSON.parse(webAppData) as BookingData | ReviewData;
    console.log('✅ Распарсенные данные:', data);

    // Обработка создания записи
    if (data.type === 'booking') {
      console.log('📝 Обработка создания записи...');
      const { serviceId, masterId, date, time } = data;

      console.log('Получение данных мастера и услуги...');
      // Получаем данные мастера и услуги
      const [master, service] = await Promise.all([
        getMasterById(masterId),
        getServiceById(serviceId),
      ]);
      console.log('✅ Мастер:', master.name);
      console.log('✅ Услуга:', service.name);

      console.log('Создание записи в БД...');
      // Создаем запись в базе данных
      const booking = await createBooking({
        client_telegram_id: userId,
        client_name: userName,
        client_username: username || null,
        master_id: masterId,
        service_id: serviceId,
        booking_date: date,
        booking_time: time,
        status: 'active',
        cancellation_reason: null,
        google_event_id: null,
      });
      console.log('✅ Запись создана:', booking.id);

      // Создаем событие в Google Calendar
      let eventId: string | null = null;
      try {
        console.log('Создание события в Google Calendar...');
        eventId = await createCalendarEvent(
          master.google_calendar_id,
          booking,
          service.duration_minutes
        );
        console.log('✅ Событие создано:', eventId);

        // Обновляем запись с ID события
        const { supabase } = await import('../services/supabase.js');
        await supabase
          .from('bookings')
          .update({ google_event_id: eventId })
          .eq('id', booking.id);
      } catch (error) {
        console.error('⚠️ Ошибка создания события в календаре:', error);
        // Продолжаем даже если не удалось создать событие
      }

      const dateFormatted = format(new Date(date), 'd MMMM yyyy', { locale: ru });

      console.log('Отправка подтверждения клиенту...');
      // Отправляем подтверждение клиенту
      await ctx.reply(
        `✅ Запись успешно создана!\n\n` +
          `📅 Дата: ${dateFormatted}\n` +
          `⏰ Время: ${time}\n` +
          `👤 Мастер: ${master.name}\n` +
          `💇 Услуга: ${service.name}\n` +
          `💰 Стоимость: ${service.price} ₽\n` +
          `⏱ Длительность: ${service.duration_minutes} мин\n\n` +
          `Мы отправим вам напоминание за 24 часа и за 1 час до визита.`
      );
      console.log('✅ Подтверждение отправлено клиенту');

      // Уведомляем администратора
      try {
        console.log('Отправка уведомления администратору...');
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `✅ Новая запись!\n\n` +
            `👤 Клиент: ${userName} ${username ? `(@${username})` : ''}\n` +
            `📅 Дата: ${dateFormatted}\n` +
            `⏰ Время: ${time}\n` +
            `💇 Услуга: ${service.name}\n` +
            `👨‍💼 Мастер: ${master.name}\n` +
            `💰 Стоимость: ${service.price} ₽`
        );
        console.log('✅ Уведомление администратору отправлено');
      } catch (error) {
        console.error('⚠️ Ошибка уведомления администратора:', error);
      }
    }

    // Обработка отзыва
    if (data.type === 'review') {
      const { bookingId, rating, comment } = data;

      const booking = await getBookingById(bookingId);

      if (booking.client_telegram_id !== userId) {
        await ctx.reply('Ошибка: это не ваша запись');
        return;
      }

      // Создаем отзыв
      await createReview({
        booking_id: bookingId,
        client_telegram_id: userId,
        master_id: booking.master_id,
        service_id: booking.service_id,
        rating,
        comment: comment || null,
      });

      await ctx.reply(
        `⭐️ Спасибо за ваш отзыв!\n\n` +
          `Ваша оценка: ${'⭐️'.repeat(rating)}\n\n` +
          `Мы ценим ваше мнение и будем рады видеть вас снова!`
      );

      // Уведомляем администратора
      try {
        await ctx.api.sendMessage(
          config.telegram.adminId,
          `⭐️ Новый отзыв!\n\n` +
            `👤 Клиент: ${userName}\n` +
            `💇 Услуга: ${booking.service.name}\n` +
            `👨‍💼 Мастер: ${booking.master.name}\n` +
            `Оценка: ${'⭐️'.repeat(rating)}\n` +
            (comment ? `\nКомментарий: ${comment}` : '')
        );
      } catch (error) {
        console.error('Ошибка уведомления администратора:', error);
      }
    }
  } catch (error) {
    console.error('❌ ОШИБКА ОБРАБОТКИ ДАННЫХ WEB APP:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    await ctx.reply('Произошла ошибка при создании записи. Попробуйте еще раз или обратитесь к администратору.');
  }
}
