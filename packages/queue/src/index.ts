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

let boss: PgBoss | undefined;

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    const b = new PgBoss({ connectionString: process.env.DATABASE_URL });
    b.on('error', (e: unknown) => logger.error('pgboss_error', { err: String(e) }));
    await b.start();
    boss = b;
  }
  return boss;
}

/** Fire-and-forget enqueue used by web/CMS. Returns the job id (or null). */
export async function enqueue<T extends object>(queue: QueueName, data: T): Promise<string | null> {
  const b = await getBoss();
  const id = await b.send(queue, data);
  logger.info('enqueued', { queue, id });
  return id;
}
