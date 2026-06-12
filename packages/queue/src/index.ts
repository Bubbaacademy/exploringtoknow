import PgBoss from 'pg-boss';
import { logger } from '@etk/core';

/**
 * Shared job queue (pg-boss, Postgres-backed). Used by BOTH:
 *  - apps/web  → enqueue() from server route handlers / Payload hooks
 *  - apps/worker → getBoss() + work() to consume
 * This is the sync/async boundary from impl pkg §5.1: HTTP/CMS code only ENQUEUES;
 * the worker executes. Server-only module — never import into client components.
 */
export const QUEUES = {
  dailyPipeline: 'daily-pipeline',
  generateContent: 'generate-content',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface GenerateContentJob {
  productId: string;
  trigger: 'force_generate' | 'daily' | 'refresh';
}

/**
 * Explicitly register every official queue. pg-boss v10 REQUIRES a queue to exist
 * (createQueue) before send()/work() will deliver jobs — otherwise send() returns
 * null and the job is silently dropped. Idempotent: only creates a queue that is
 * not already registered, so it is safe to run against an existing database.
 */
export async function ensureQueues(b: PgBoss): Promise<void> {
  for (const name of Object.values(QUEUES)) {
    const existing = await b.getQueue(name);
    if (!existing) await b.createQueue(name);
  }
}

let bossPromise: Promise<PgBoss> | undefined;

async function initBoss(): Promise<PgBoss> {
  const b = new PgBoss({ connectionString: process.env.DATABASE_URL });
  b.on('error', (e: unknown) => logger.error('pgboss_error', { err: String(e) }));
  await b.start();
  await ensureQueues(b);
  logger.info('pgboss_ready', { queues: Object.values(QUEUES) });
  return b;
}

/**
 * Shared pg-boss accessor. Starts pg-boss EXACTLY ONCE per process and does not
 * resolve until ALL official queues are registered. Concurrent callers share the
 * SAME initialization promise (no race on queue creation). If initialization
 * fails, the error propagates (never swallowed) and the cached promise is cleared
 * so a later call can retry rather than reusing a rejected init.
 */
export function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    bossPromise = initBoss().catch((e) => {
      bossPromise = undefined;
      throw e;
    });
  }
  return bossPromise;
}

/**
 * Enqueue a job and FAIL LOUD. pg-boss send() returns null/empty when the job was
 * not created (e.g. an unregistered queue) — treat that as a hard error so callers
 * can never report success for a dropped job. Returns a real, non-empty job id.
 */
export async function enqueue<T extends object>(queue: QueueName, data: T): Promise<string> {
  const b = await getBoss();
  const id = await b.send(queue, data);
  if (!id) {
    throw new Error(
      `enqueue failed: pg-boss returned no job id for queue "${queue}" — the job was not created (queue unregistered or dropped)`,
    );
  }
  logger.info('enqueued', { queue, id });
  return id;
}
