// API endpoint для отправки уведомлений о новой записи

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Bot } from 'grammy';
import { config } from '../config.js';
import { createCalendarEvent } from '../services/google-calendar.js';
import { usePromoCode } from '../services/promo-codes.js';
import { getMasterById, getServiceById, supabase } from '../services/supabase.js';

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
  console.log('📧 Отправка уведомлений о записи:', data.bookingId);

  try {
    // Получаем данные мастера и услуги
    const [master, service] = await Promise.all([
      getMasterById(data.masterId),
      getServiceById(data.serviceId),
    ]);

    const dateFormatted = format(new Date(data.bookingDate), 'd MMMM yyyy', {
      locale: ru,
    });

    // Создаем событие в Google Calendar
    try {
      console.log('📅 Создание события в Google Calendar:', config.app.googleCalendarId);

      const eventId = await createCalendarEvent(
        config.app.googleCalendarId,
        {
          id: data.bookingId,
          client_telegram_id: data.clientTelegramId,
          client_name: data.clientName,
          client_username: data.clientUsername,
          client_id: null,
          master_id: data.masterId,
          service_id: data.serviceId,
          booking_date: data.bookingDate,
          booking_time: data.bookingTime,
          status: 'active',
          source: 'online',
          cancellation_reason: null,
          google_event_id: null,
          original_price: data.originalPrice,
          discount_amount: data.discountAmount,
          final_price: data.finalPrice,
          promo_code: data.promoCode || null,
          admin_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        service.duration_minutes,
        master.name,
      );

      console.log('✅ Событие создано в календаре:', eventId);

      // Обновляем статус записи на 'active' и сохраняем event_id
      await supabase
        .from('bookings')
        .update({
          status: 'active',
          google_event_id: eventId,
        })
        .eq('id', data.bookingId);

      console.log('✅ Статус записи обновлен на active');
    } catch (calendarError) {
      console.error('⚠️ Ошибка создания события в календаре:', calendarError);
      console.log('ℹ️ Запись сохранена в базе данных, но не добавлена в Google Calendar');
      // Не блокируем отправку уведомлений если календарь не работает
    }

    // Используем промокод если он был применён
    if (data.promoCode) {
      try {
        await usePromoCode(data.promoCode, data.bookingId);
        console.log('✅ Промокод использован:', data.promoCode);
      } catch (error) {
        console.error('⚠️ Ошибка использования промокода:', error);
      }
    }

    // Отправляем уведомление клиенту
    try {
      await bot.api.sendMessage(
        data.clientTelegramId,
        `✅ Запись успешно создана!\n\n📅 Дата: ${dateFormatted}\n⏰ Время: ${data.bookingTime}\n👤 Мастер: ${master.name}\n💇 Услуга: ${service.name}\n💰 Стоимость: ${service.price} ₽\n⏱ Длительность: ${service.duration_minutes} мин\n\nМы отправим вам напоминание за 24 часа и за 1 час до визита.`,
      );
      console.log('✅ Уведомление клиенту отправлено');
    } catch (error) {
      console.error('⚠️ Ошибка отправки уведомления клиенту:', error);
    }

    // Отправляем уведомление администратору
    try {
      await bot.api.sendMessage(
        config.telegram.adminId,
        `🔔 Новая запись!\n\n👤 Клиент: ${data.clientName}${data.clientUsername ? ` (@${data.clientUsername})` : ''}\n📅 Дата: ${dateFormatted}\n⏰ Время: ${data.bookingTime}\n💇 Услуга: ${service.name}\n👨‍💼 Мастер: ${master.name}\n💰 Стоимость: ${service.price} ₽`,
      );
      console.log('✅ Уведомление администратору отправлено');
    } catch (error) {
      console.error('⚠️ Ошибка отправки уведомления администратору:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка обработки уведомления:', error);
    throw error;
  }
}
