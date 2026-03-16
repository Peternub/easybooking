// Конфигурация бота

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminId: Number(process.env.TELEGRAM_ADMIN_ID) || 0,
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  app: {
    webappUrl: process.env.WEBAPP_URL || '',
    timezone: process.env.TIMEZONE || 'Europe/Moscow',
  },
} as const;

// Валидация конфигурации
export function validateConfig() {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_ADMIN_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'WEBAPP_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
  }
}
