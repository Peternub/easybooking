// Отправка напоминаний и запросов на отзывы

import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getUpcomingBookings, hasReview } from '../services/supabase.js';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { config } from '../config.js';

// Напоминание за 24 часа
export async function sendReminders24h(bot: Bot) {
  try {
    const bookings = await getUpcomingBookings(24);

    for (const booking of bookings) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const hoursUntil = differenceInHours(bookingDateTime, new Date());

      // Отправляем только если осталось примерно 24 часа (23-25 часов)
      if (hoursUntil >= 23 && hoursUntil <= 25) {
        const dateFormatted = format(bookingDateTime, 'd MMMM yyyy', { locale: ru });

        const keyboard = new InlineKeyboard().text(
          '❌ Отменить запись',
          `cancel_booking:${booking.id}`
        );

        await bot.api.sendMessage(
          booking.client_telegram_id,
          `⏰ Напоминание о записи!\n\n` +
            `Завтра у вас запись:\n` +
            `📅 ${dateFormatted}\n` +
            `⏰ Время: ${booking.booking_time}\n` +
            `👤 Мастер: ${booking.master.name}\n` +
            `💇 Услуга: ${booking.service.name}\n` +
            `💰 Стоимость: ${booking.service.price} ₽\n\n` +
            `Ждем вас! Если планы изменились, вы можете отменить запись.`,
          { reply_markup: keyboard }
        );

        console.log(`📬 Отправлено напоминание за 24ч клиенту ${booking.client_telegram_id}`);
      }
    }
  } catch (error) {
    console.error('Ошибка отправки напоминаний за 24ч:', error);
  }
}

// Напоминание за 1 час
export async function sendReminders1h(bot: Bot) {
  try {
    const bookings = await getUpcomingBookings(1);

    for (const booking of bookings) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const minutesUntil = differenceInMinutes(bookingDateTime, new Date());

      // Отправляем только если осталось примерно 1 час (55-65 минут)
      if (minutesUntil >= 55 && minutesUntil <= 65) {
        const keyboard = new InlineKeyboard().text(
          '❌ Отменить запись',
          `cancel_booking:${booking.id}`
        );

        await bot.api.sendMessage(
          booking.client_telegram_id,
          `⏰ Напоминание!\n\n` +
            `Через час у вас запись:\n` +
            `⏰ Время: ${booking.booking_time}\n` +
            `👤 Мастер: ${booking.master.name}\n` +
            `💇 Услуга: ${booking.service.name}\n\n` +
            `До встречи!`,
          { reply_markup: keyboard }
        );

        console.log(`📬 Отправлено напоминание за 1ч клиенту ${booking.client_telegram_id}`);
      }
    }
  } catch (error) {
    console.error('Ошибка отправки напоминаний за 1ч:', error);
  }
}

// Запрос на отзыв (через 2 часа после начала услуги)
export async function sendReviewRequests(bot: Bot) {
  try {
    const bookings = await getUpcomingBookings(-2); // Прошедшие записи

    for (const booking of bookings) {
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const hoursAfter = Math.abs(differenceInHours(bookingDateTime, new Date()));

      // Отправляем только если прошло примерно 2 часа (2-3 часа)
      if (hoursAfter >= 2 && hoursAfter <= 3) {
        // Проверяем, не оставлен ли уже отзыв
        const reviewExists = await hasReview(booking.id);
        if (reviewExists) continue;

        const keyboard = new InlineKeyboard().webApp(
          '⭐️ Оставить отзыв',
          `${config.app.webappUrl}/review/${booking.id}`
        );

        await bot.api.sendMessage(
          booking.client_telegram_id,
          `Спасибо, что посетили нас! 🙏\n\n` +
            `Надеемся, вам понравилось!\n` +
            `Пожалуйста, оцените качество услуги и работу мастера.\n\n` +
            `Ваше мнение очень важно для нас! ⭐️`,
          { reply_markup: keyboard }
        );

        console.log(`📬 Отправлен запрос на отзыв клиенту ${booking.client_telegram_id}`);
      }
    }
  } catch (error) {
    console.error('Ошибка отправки запросов на отзывы:', error);
  }
}
