import type PgBoss from 'pg-boss';
import { logger } from '@etk/core';
import { QUEUES, type GenerateContentJob } from '@etk/queue';
import { RestPersistenceClient, generateAndPersist } from '@etk/persistence';

/**
 * Worker handlers.
 *  - daily-pipeline: (Phase 4) selects active products by priority and fans out.
 *  - generate-content: loads the product from the catalog, runs the AI pipeline
 *    (intelligence → brief → article → quality gate → regeneration), then
 *    persists intelligence/brief/article + a generation-runs cost ledger back to
 *    Payload over the REST API (Approach B). Generation is MOCK unless a provider
 *    key is set in the worker env; persistence happens either way.
 */

/** Build the Payload REST client the worker writes through. */
function makeClient(): RestPersistenceClient {
  const baseUrl =
    process.env.PAYLOAD_INTERNAL_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://app:3000';
  const apiKey = process.env.WORKER_PAYLOAD_API_KEY || '';
  return new RestPersistenceClient({ baseUrl, apiKey, authCollection: 'users' });
}

export async function registerJobs(boss: PgBoss): Promise<void> {
  await boss.work(QUEUES.dailyPipeline, async () => {
    logger.info('daily_pipeline_tick');
  });

  await boss.work(QUEUES.generateContent, async ([job]) => {
    const data = (job?.data ?? {}) as Partial<GenerateContentJob>;
    if (!data.productId) {
      logger.error('generate_content_missing_product');
      return;
    }
    logger.info('generate_content_start', { productId: data.productId, trigger: data.trigger });

    try {
      const client = makeClient();
      const saved = await generateAndPersist(client, { productId: data.productId }, { maxAttempts: 2 });
      logger.info('generate_content_done', {
        productId: data.productId,
        runId: saved.runId,
        articleId: saved.articleId,
        articleSlug: saved.articleSlug,
        status: saved.articleStatus,
        passed: saved.passed,
      });
      // Link the finished Article back to the originating Product Request (if any).
      // Separate REST transaction (no parent txn → no deadlock); status='completed'
      // is not an approval transition, so the approval hook does not re-fire.
      if (data.requestId) {
        try {
          await client.update('product-requests', data.requestId, {
            linkedArticle: saved.articleId,
            status: 'completed',
          });
        } catch (e) {
          logger.error('generate_content_request_link_failed', { requestId: data.requestId, err: String(e) });
        }
      }
    } catch (e) {
      // Surface to pg-boss so the failure is recorded / retried per queue policy.
      logger.error('generate_content_failed', { productId: data.productId, err: String(e) });
      throw e;
    }
  });
}
