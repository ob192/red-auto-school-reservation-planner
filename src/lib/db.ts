import { Pool } from 'pg';
import pg from 'pg';

pg.types.setTypeParser(1082, (val: string) => val);   // date → "YYYY-MM-DD"
pg.types.setTypeParser(1114, (val: string) => val);   // timestamp → string
pg.types.setTypeParser(1184, (val: string) => val);   // timestamptz → string

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const sslEnv = process.env.DATABASE_SSL;
  const ssl =
      sslEnv === 'true'
          ? { rejectUnauthorized: false }
          : false;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl,
  });
  pool.on('error', (err) => console.error('[pg] pool error:', err));
  return pool;
}

const pool: Pool = global._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') global._pgPool = pool;

export default pool;

export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}