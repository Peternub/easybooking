// API endpoint для отправки уведомлений о новой записи

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Bot } from 'grammy';
import { config } from '../config.js';
import { usePromoCode } from '../services/promo-codes.js';
import { getMasterById, getServiceById } from '../services/supabase.js';

interface NotifyBookingRequest {
  bookingId: string;
  clientTelegramId: number;
  clientName: string;
  clientUsername: string | null;
  masterId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  promoCode?: string;
}

export async function handleNotifyBooking(bot: Bot, data: NotifyBookingRequest) {
  console.log('Отправка уведомлений о записи:', data.bookingId);

  try {
    const [master, service] = await Promise.all([
      getMasterById(data.masterId),
      getServiceById(data.serviceId),
    ]);

    const dateFormatted = format(new Date(data.bookingDate), 'd MMMM yyyy', {
      locale: ru,
    });

    if (data.promoCode) {
      try {
        await usePromoCode(data.promoCode, data.bookingId);
        console.log('Промокод использован:', data.promoCode);
      } catch (error) {
        console.error('Ошибка использования промокода:', error);
      }
    }

    try {
      await bot.api.sendMessage(
        data.clientTelegramId,
        `✅ Запись успешно создана!\n\n📅 Дата: ${dateFormatted}\n⏰ Время: ${data.bookingTime}\n👤 Мастер: ${master.name}\n💇 Услуга: ${service.name}\n💰 Стоимость: ${service.price} ₽\n⏱ Длительность: ${service.duration_minutes} мин\n\nМы отправим вам напоминание за 24 часа и за 1 час до визита.`,
      );
    } catch (error) {
      console.error('Ошибка отправки уведомления клиенту:', error);
    }

    try {
      await bot.api.sendMessage(
        config.telegram.adminId,
        `🔔 Новая запись!\n\n👤 Клиент: ${data.clientName}${data.clientUsername ? ` (@${data.clientUsername})` : ''}\n📅 Дата: ${dateFormatted}\n⏰ Время: ${data.bookingTime}\n💇 Услуга: ${service.name}\n👨‍💼 Мастер: ${master.name}\n💰 Стоимость: ${service.price} ₽`,
      );
    } catch (error) {
      console.error('Ошибка отправки уведомления администратору:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('Ошибка обработки уведомления:', error);
    throw error;
  }
}
