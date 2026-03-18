import { Pool } from 'pg';
import { config, hasPostgresConfig } from '../config.js';

function createPool() {
  if (config.postgres.url) {
    return new Pool({
      connectionString: config.postgres.url,
      ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
    });
  }

  return new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
    ssl: config.postgres.ssl ? { rejectUnauthorized: false } : false,
  });
}

export const db = hasPostgresConfig() ? createPool() : null;

export async function checkPostgresConnection() {
  if (!db) {
    return {
      ok: false,
      message: 'PostgreSQL не настроен',
    };
  }

  const client = await db.connect();

  try {
    await client.query('select 1');

    return {
      ok: true,
      message: 'PostgreSQL подключен',
    };
  } finally {
    client.release();
  }
}
