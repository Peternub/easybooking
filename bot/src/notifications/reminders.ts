// Отправка напоминаний и запросов на отзывы

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BookingWithDetails } from '../../../shared/types.js';
import { config } from '../config.js';
import {
  getBookingsForDateRange,
  hasReview,
  markBookingNotificationSent,
} from '../services/supabase.js';

const CHECK_TOLERANCE_MINUTES = 5;

function getBookingDateTime(booking: BookingWithDetails) {
  return new Date(`${booking.booking_date}T${booking.booking_time}`);
}

function getMinutesUntil(date: Date, now: Date) {
  return Math.round((date.getTime() - now.getTime()) / 60000);
}

function getMinutesAfter(date: Date, now: Date) {
  return Math.round((now.getTime() - date.getTime()) / 60000);
}

function isInWindow(value: number, targetMinutes: number) {
  return (
    value >= targetMinutes - CHECK_TOLERANCE_MINUTES &&
    value <= targetMinutes + CHECK_TOLERANCE_MINUTES
  );
}

async function getBookingsAroundNow(
  hoursOffsetStart: number,
  hoursOffsetEnd: number,
  statuses: string[],
) {
  const now = new Date();
  const start = new Date(now.getTime() + hoursOffsetStart * 60 * 60 * 1000);
  const end = new Date(now.getTime() + hoursOffsetEnd * 60 * 60 * 1000);

  const fromDate = (start < end ? start : end).toISOString().split('T')[0];
  const toDate = (start < end ? end : start).toISOString().split('T')[0];

  return getBookingsForDateRange(fromDate, toDate, statuses);
}

// Напоминание за 24 часа
export async function sendReminders24h(bot: Bot) {
  try {
    const now = new Date();
    const bookings = await getBookingsAroundNow(0, 26, ['active']);

    for (const booking of bookings) {
      if (booking.reminder_24h_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking);
      const minutesUntil = getMinutesUntil(bookingDateTime, now);

      if (!isInWindow(minutesUntil, 24 * 60)) continue;

      const dateFormatted = format(bookingDateTime, 'd MMMM yyyy', { locale: ru });
      const keyboard = new InlineKeyboard().text(
        '❌ Отменить запись',
        `cancel_booking:${booking.id}`,
      );

      await bot.api.sendMessage(
        booking.client_telegram_id,
        `⏰ Напоминание о записи!\n\nЗавтра у вас запись:\n📅 ${dateFormatted}\n⏰ Время: ${booking.booking_time}\n👤 Мастер: ${booking.master.name}\n💇 Услуга: ${booking.service.name}\n💰 Стоимость: ${booking.service.price} ₽\n\nЖдем вас! Если планы изменились, вы можете отменить запись.`,
        { reply_markup: keyboard },
      );

      await markBookingNotificationSent(booking.id, 'reminder_24h');
      console.log(`📬 Отправлено напоминание за 24ч клиенту ${booking.client_telegram_id}`);
    }
  } catch (error) {
    console.error('Ошибка отправки напоминаний за 24ч:', error);
  }
}

// Напоминание за 1 час
export async function sendReminders1h(bot: Bot) {
  try {
    const now = new Date();
    const bookings = await getBookingsAroundNow(0, 2, ['active']);

    for (const booking of bookings) {
      if (booking.reminder_1h_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking);
      const minutesUntil = getMinutesUntil(bookingDateTime, now);

      if (!isInWindow(minutesUntil, 60)) continue;

      const keyboard = new InlineKeyboard().text(
        '❌ Отменить запись',
        `cancel_booking:${booking.id}`,
      );

      await bot.api.sendMessage(
        booking.client_telegram_id,
        `⏰ Напоминание!\n\nЧерез час у вас запись:\n⏰ Время: ${booking.booking_time}\n👤 Мастер: ${booking.master.name}\n💇 Услуга: ${booking.service.name}\n\nДо встречи!`,
        { reply_markup: keyboard },
      );

      await markBookingNotificationSent(booking.id, 'reminder_1h');
      console.log(`📬 Отправлено напоминание за 1ч клиенту ${booking.client_telegram_id}`);
    }
  } catch (error) {
    console.error('Ошибка отправки напоминаний за 1ч:', error);
  }
}

// Запрос на отзыв через 1 час после начала услуги
export async function sendReviewRequests(bot: Bot) {
  try {
    const now = new Date();
    const bookings = await getBookingsAroundNow(-3, 0, ['active', 'completed']);

    for (const booking of bookings) {
      if (booking.review_request_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking);
      const minutesAfter = getMinutesAfter(bookingDateTime, now);

      if (!isInWindow(minutesAfter, 60)) continue;

      const reviewExists = await hasReview(booking.id);
      if (reviewExists) continue;

      const keyboard = new InlineKeyboard().webApp(
        '⭐️ Оставить отзыв',
        `${config.app.webappUrl}/review/${booking.id}`,
      );

      await bot.api.sendMessage(
        booking.client_telegram_id,
        'Спасибо, что посетили нас! 🙏\n\nНадеемся, вам понравилось!\nПожалуйста, оцените качество услуги и работу мастера.\n\nВаше мнение очень важно для нас! ⭐️',
        { reply_markup: keyboard },
      );

      await markBookingNotificationSent(booking.id, 'review_request');
      console.log(`📬 Отправлен запрос на отзыв клиенту ${booking.client_telegram_id}`);
    }
  } catch (error) {
    console.error('Ошибка отправки запросов на отзывы:', error);
  }
}
