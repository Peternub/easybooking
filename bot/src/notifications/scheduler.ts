// Планировщик уведомлений

import type { Bot } from 'grammy';
import { sendInactiveClientNotifications } from './inactive-clients.js';
import { sendReminders1h, sendReminders24h, sendReviewRequests } from './reminders.js';

const CHECK_INTERVAL = 5 * 60 * 1000; // Проверка каждые 5 минут
const INACTIVE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // Проверка неактивных клиентов раз в сутки

export function startNotificationScheduler(bot: Bot) {
  console.log('📬 Запуск планировщика уведомлений...');

  // Немедленная проверка при запуске
  checkAndSendNotifications(bot);

  // Периодическая проверка уведомлений
  setInterval(() => {
    checkAndSendNotifications(bot);
  }, CHECK_INTERVAL);

  // Проверка неактивных клиентов раз в сутки
  setInterval(() => {
    sendInactiveClientNotifications(bot);
  }, INACTIVE_CHECK_INTERVAL);

  // Первая проверка неактивных клиентов через 1 минуту после запуска
  setTimeout(() => {
    sendInactiveClientNotifications(bot);
  }, 60 * 1000);
}

async function checkAndSendNotifications(bot: Bot) {
  try {
    console.log('🔍 Проверка уведомлений...');

    // Отправляем напоминания за 24 часа
    await sendReminders24h(bot);

    // Отправляем напоминания за 1 час
    await sendReminders1h(bot);

    // Отправляем запросы на отзывы
    await sendReviewRequests(bot);

    console.log('✅ Проверка уведомлений завершена');
  } catch (error) {
    console.error('❌ Ошибка при проверке уведомлений:', error);
  }
}
