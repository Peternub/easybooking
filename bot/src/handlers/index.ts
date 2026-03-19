// Регистрация всех обработчиков бота

import type { Bot } from 'grammy';
import { handleMyBookings } from './bookings.js';
import { handleCancelBooking } from './cancel.js';
import { handleStart } from './start.js';
import { handleWebApp } from './webapp.js';

export function setupHandlers(bot: Bot) {
  // Команды
  bot.command('start', handleStart);
  bot.command('mybookings', handleMyBookings);

  // Callback queries
  bot.callbackQuery('my_bookings', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleMyBookings(ctx as any);
  });
  bot.callbackQuery(/^cancel_booking:(.+)$/, handleCancelBooking);
  bot.callbackQuery(/^confirm_cancel:(.+)$/, handleCancelBooking);
  bot.callbackQuery('cancel_action', handleCancelBooking);

  // Web App данные
  bot.on('message:web_app_data', handleWebApp);

  // Обработка неизвестных команд
  bot.on('message:text', async (ctx) => {
    await ctx.reply(
      'Используйте команды:\n' + '/start - Главное меню\n' + '/mybookings - Мои записи',
    );
  });
}
