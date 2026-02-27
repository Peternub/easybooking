// API endpoint для уведомления клиента об отмене записи администратором

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Bot } from 'grammy';

interface NotifyCancellationData {
  clientTelegramId: number;
  bookingId: string;
  reason: string;
  bookingDate: string;
  bookingTime: string;
  masterName: string;
  serviceName: string;
}

export async function handleNotifyCancellation(bot: Bot, data: NotifyCancellationData) {
  try {
    console.log('📢 Отправка уведомления об отмене записи:', data);

    const dateFormatted = format(new Date(data.bookingDate), 'd MMMM yyyy', { locale: ru });
    const timeFormatted = data.bookingTime.substring(0, 5);

    const message = `❌ Ваша запись отменена администратором\n\n📅 Дата: ${dateFormatted}\n🕐 Время: ${timeFormatted}\n👤 Мастер: ${data.masterName}\n💼 Услуга: ${data.serviceName}\n\n📝 Причина отмены:\n${data.reason}\n\nПриносим извинения за неудобства. Вы можете записаться на другое время.`;

    await bot.api.sendMessage(data.clientTelegramId, message);

    console.log('✅ Уведомление об отмене отправлено клиенту:', data.clientTelegramId);

    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления об отмене:', error);
    throw error;
  }
}
