import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getPool } from './index';

/**
 * Minimal forward-only migration runner for the OPERATIONAL tables (not Payload).
 * Applies packages/db/migrations/*.sql in lexical order, once each, tracked in
 * a _ops_migrations table. Run: `pnpm --filter @etk/db migrate`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'migrations');

export async function migrate(): Promise<void> {
  const pool = getPool();
  await pool.query(
    'CREATE TABLE IF NOT EXISTS _ops_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const name of files) {
    const done = await pool.query('SELECT 1 FROM _ops_migrations WHERE name = $1', [name]);
    if (done.rowCount) continue;
    const sql = readFileSync(join(dir, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _ops_migrations(name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log('applied', name);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  console.log('migrations up to date');
}

// Allow `tsx src/migrate.ts` direct invocation.
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
