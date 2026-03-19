export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminId: Number(process.env.TELEGRAM_ADMIN_ID) || 0,
  },
  postgres: {
    url: process.env.POSTGRES_URL || '',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || '',
    user: process.env.POSTGRES_USER || '',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true',
  },
  app: {
    webappUrl: process.env.WEBAPP_URL || '',
    timezone: process.env.TIMEZONE || 'Europe/Moscow',
  },
} as const;

export function validateConfig() {
  const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_ID', 'WEBAPP_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
  }

  if (!hasPostgresConfig()) {
    throw new Error('Нужно настроить PostgreSQL');
  }
}

export function hasPostgresConfig() {
  return Boolean(
    config.postgres.url ||
      (config.postgres.host &&
        config.postgres.database &&
        config.postgres.user &&
        config.postgres.password),
  );
}
