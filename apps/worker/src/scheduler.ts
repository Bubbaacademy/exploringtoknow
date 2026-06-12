import cron from 'node-cron';
import { logger } from '@etk/core';
import { enqueue, QUEUES } from './queues';

/**
 * Daily automation orchestrator entry (impl pkg left-rail). Schedules the daily
 * run; the actual pipeline runs as queued jobs (no human intervention).
 * Uses the shared enqueue() so a dropped job (null id) is logged as a failure
 * instead of silently disappearing.
 */
export function startScheduler(): void {
  const expr = process.env.WORKER_CRON_DAILY || '0 6 * * *';
  cron.schedule(expr, async () => {
    try {
      const id = await enqueue(QUEUES.dailyPipeline, { trigger: 'daily' });
      logger.info('daily_run_enqueued', { expr, id });
    } catch (e) {
      logger.error('daily_run_enqueue_failed', { expr, err: String(e) });
    }
  });
  logger.info('scheduler_started', { expr });
}
