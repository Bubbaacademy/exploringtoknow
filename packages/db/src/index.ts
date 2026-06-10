import { Pool } from 'pg';

/**
 * Operational Postgres client for NON-Payload tables (pipeline_runs, jobs,
 * tracking_links, click_events, metric_snapshots, refresh_queue — impl pkg §3).
 * Payload manages its own connection for content collections; this is the
 * companion data layer. Same database, two zones.
 */
let pool: Pool | undefined;
export function getPool(): Pool {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}
export async function ping(): Promise<boolean> {
  const r = await getPool().query('select 1 as ok');
  return r.rows[0]?.ok === 1;
}
