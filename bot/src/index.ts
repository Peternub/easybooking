// Главный файл Telegram бота

import { Bot, webhookCallback } from 'grammy';
import { config, validateConfig } from './config.js';
import { setupHandlers } from './handlers/index.js';
import { startNotificationScheduler } from './notifications/scheduler.js';

// Валидация конфигурации
try {
  validateConfig();
} catch (error) {
  console.error('Ошибка конфигурации:', error);
  process.exit(1);
}

// Создание бота
const bot = new Bot(config.telegram.botToken);

// Настройка обработчиков
setupHandlers(bot);

// Обработка ошибок
bot.catch((err) => {
  console.error('Ошибка в боте:', err);
});

// Development: используем long polling
console.log('🤖 Бот запускается в режиме разработки...');

bot.start({
  onStart: () => {
    console.log('✅ Бот успешно запущен!');
    console.log(`📱 Бот: @${bot.botInfo.username}`);

    // Запускаем планировщик уведомлений
    startNotificationScheduler(bot);
  },
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹️  Остановка бота...');
  bot.stop();
});
process.once('SIGTERM', () => {
  console.log('\n⏹️  Остановка бота...');
  bot.stop();
});
