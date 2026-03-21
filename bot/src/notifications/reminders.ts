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
} from '../services/data.js';

const CHECK_TOLERANCE_MINUTES = 1;

function getNowInTimezone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );

  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    ),
  );
}

function getBookingDateTime(booking: BookingWithDetails, timeZone: string) {
  void timeZone;
  const [year, month, day] = booking.booking_date.split('-').map(Number);
  const [hours, minutes, seconds = 0] = booking.booking_time.split(':').map(Number);

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
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
  const now = getNowInTimezone(config.app.timezone);
  const start = new Date(now.getTime() + hoursOffsetStart * 60 * 60 * 1000);
  const end = new Date(now.getTime() + hoursOffsetEnd * 60 * 60 * 1000);

  const fromDate = (start < end ? start : end).toISOString().split('T')[0];
  const toDate = (start < end ? end : start).toISOString().split('T')[0];

  return getBookingsForDateRange(fromDate, toDate, statuses);
}

// Напоминание за 24 часа
export async function sendReminders24h(bot: Bot) {
  try {
    const now = getNowInTimezone(config.app.timezone);
    const bookings = await getBookingsAroundNow(23, 25, ['active']);

    for (const booking of bookings) {
      if (booking.source !== 'online') continue;
      if (booking.reminder_24h_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking, config.app.timezone);
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
    const now = getNowInTimezone(config.app.timezone);
    const bookings = await getBookingsAroundNow(0, 2, ['active']);

    for (const booking of bookings) {
      if (booking.source !== 'online') continue;
      if (booking.reminder_1h_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking, config.app.timezone);
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
    const now = getNowInTimezone(config.app.timezone);
    const bookings = await getBookingsAroundNow(-2, 0, ['active', 'completed']);

    for (const booking of bookings) {
      if (booking.source !== 'online') continue;
      if (booking.review_request_sent_at) continue;

      const bookingDateTime = getBookingDateTime(booking, config.app.timezone);
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
