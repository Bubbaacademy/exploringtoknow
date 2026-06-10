import cron from 'node-cron';
import { logger } from '@etk/core';
import { getBoss, QUEUES } from './queues';

/**
 * Daily automation orchestrator entry (impl pkg left-rail). Schedules the daily
 * run; the actual pipeline runs as queued jobs (no human intervention).
 */
export function startScheduler(): void {
  const expr = process.env.WORKER_CRON_DAILY || '0 6 * * *';
  cron.schedule(expr, async () => {
    const boss = await getBoss();
    await boss.send(QUEUES.dailyPipeline, {});
    logger.info('daily_run_enqueued', { expr });
  });
  logger.info('scheduler_started', { expr });
}
