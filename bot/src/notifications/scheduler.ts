import type { Bot } from 'grammy';
import { sendInactiveClientNotifications } from './inactive-clients.js';
import { sendReminders1h, sendReminders24h, sendReviewRequests } from './reminders.js';

const CHECK_INTERVAL = 60 * 1000; // Проверка каждую минуту
const INACTIVE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // Проверка неактивных клиентов раз в сутки

export function startNotificationScheduler(bot: Bot) {
  console.log('Запуск планировщика уведомлений...');

  checkAndSendNotifications(bot);

  setInterval(() => {
    checkAndSendNotifications(bot);
  }, CHECK_INTERVAL);

  setInterval(() => {
    sendInactiveClientNotifications(bot);
  }, INACTIVE_CHECK_INTERVAL);

  setTimeout(() => {
    sendInactiveClientNotifications(bot);
  }, 60 * 1000);
}

async function checkAndSendNotifications(bot: Bot) {
  try {
    console.log('Проверка уведомлений...');

    await sendReminders24h(bot);
    await sendReminders1h(bot);
    await sendReviewRequests(bot);

    console.log('Проверка уведомлений завершена');
  } catch (error) {
    console.error('Ошибка при проверке уведомлений:', error);
  }
}
