// Планировщик уведомлений

import type { Bot } from 'grammy';
import { sendReminders24h, sendReminders1h, sendReviewRequests } from './reminders.js';

const CHECK_INTERVAL = 5 * 60 * 1000; // Проверка каждые 5 минут

export function startNotificationScheduler(bot: Bot) {
  console.log('📬 Запуск планировщика уведомлений...');

  // Немедленная проверка при запуске
  checkAndSendNotifications(bot);

  // Периодическая проверка
  setInterval(() => {
    checkAndSendNotifications(bot);
  }, CHECK_INTERVAL);
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
