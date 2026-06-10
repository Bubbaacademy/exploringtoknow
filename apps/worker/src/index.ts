import { logger, loadEnv } from '@etk/core';
import { getBoss } from './queues';
import { registerJobs } from './jobs';
import { startScheduler } from './scheduler';

/**
 * Worker runtime entrypoint. MUST run on a long-running host (AWS ECS/Fargate or
 * a dedicated Node process) — not a short-lived serverless function.
 */
async function main() {
  loadEnv(); // fail fast if required env is missing
  const boss = await getBoss();
  await registerJobs(boss);
  startScheduler();
  logger.info('worker_ready');
}

main().catch((err) => {
  logger.error('worker_fatal', { err: String(err) });
  process.exit(1);
});
