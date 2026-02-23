// Уведомления для неактивных клиентов

import type { Bot } from 'grammy';
import { createPromoCode, getInactiveClients } from '../services/promo-codes.js';

export async function sendInactiveClientNotifications(bot: Bot) {
  console.log('🔍 Проверка неактивных клиентов...');

  try {
    const inactiveClients = await getInactiveClients(60);

    if (inactiveClients.length === 0) {
      console.log('✅ Нет неактивных клиентов');
      return;
    }

    console.log(`📧 Найдено ${inactiveClients.length} неактивных клиентов`);

    for (const clientId of inactiveClients) {
      try {
        // Создаём промокод на 10% со сроком действия 7 дней
        const promo = await createPromoCode(clientId, 10, 7);

        const validUntil = new Date(promo.valid_until);
        const validUntilFormatted = validUntil.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
        });

        // Отправляем сообщение с промокодом
        await bot.api.sendMessage(
          clientId,
          `👋 Мы скучали по вам!\n\n` +
            `Давно не виделись! Специально для вас мы подготовили персональную скидку 10% на любую услугу.\n\n` +
            `🎁 Ваш промокод: <code>${promo.code}</code>\n` +
            `⏰ Действует до ${validUntilFormatted}\n\n` +
            `Нажмите "Записаться на услугу" и используйте промокод при оформлении записи!`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📅 Записаться на услугу', web_app: { url: process.env.WEBAPP_URL || '' } }],
              ],
            },
          },
        );

        console.log(`✅ Промокод ${promo.code} отправлен клиенту ${clientId}`);
      } catch (error) {
        console.error(`❌ Ошибка отправки промокода клиенту ${clientId}:`, error);
      }
    }

    console.log('✅ Рассылка неактивным клиентам завершена');
  } catch (error) {
    console.error('❌ Ошибка проверки неактивных клиентов:', error);
  }
}
