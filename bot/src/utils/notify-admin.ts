// Утилита для отправки уведомлений администратору

import type { Bot } from 'grammy';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { config } from '../config.js';

export async function notifyNewBooking(
  bot: Bot,
  booking: {
    client_name: string;
    client_username: string | null;
    booking_date: string;
    booking_time: string;
    master_name: string;
    service_name: string;
    service_price: number;
  }
) {
  try {
    const dateFormatted = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });

    await bot.api.sendMessage(
      config.telegram.adminId,
      `✅ Новая запись!\n\n` +
        `👤 Клиент: ${booking.client_name} ${booking.client_username ? `(@${booking.client_username})` : ''}\n` +
        `📅 Дата: ${dateFormatted}\n` +
        `⏰ Время: ${booking.booking_time}\n` +
        `💇 Услуга: ${booking.service_name}\n` +
        `👨‍💼 Мастер: ${booking.master_name}\n` +
        `💰 Стоимость: ${booking.service_price} ₽`
    );

    console.log('✅ Уведомление администратору отправлено');
  } catch (error) {
    console.error('⚠️ Ошибка отправки уведомления администратору:', error);
  }
}

export async function notifyClient(
  bot: Bot,
  clientTelegramId: number,
  booking: {
    booking_date: string;
    booking_time: string;
    master_name: string;
    service_name: string;
    service_price: number;
    service_duration: number;
  }
) {
  try {
    const dateFormatted = format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru });

    await bot.api.sendMessage(
      clientTelegramId,
      `✅ Запись успешно создана!\n\n` +
        `📅 Дата: ${dateFormatted}\n` +
        `⏰ Время: ${booking.booking_time}\n` +
        `👤 Мастер: ${booking.master_name}\n` +
        `💇 Услуга: ${booking.service_name}\n` +
        `💰 Стоимость: ${booking.service_price} ₽\n` +
        `⏱ Длительность: ${booking.service_duration} мин\n\n` +
        `Мы отправим вам напоминание за 24 часа и за 1 час до визита.`
    );

    console.log('✅ Уведомление клиенту отправлено');
  } catch (error) {
    console.error('⚠️ Ошибка отправки уведомления клиенту:', error);
  }
}
