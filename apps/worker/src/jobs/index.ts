import type PgBoss from 'pg-boss';
import { logger } from '@etk/core';
import { QUEUES, type GenerateContentJob, type GenerateTopicArticleJob } from '@etk/queue';
import { RestPersistenceClient, generateAndPersist, generateAndPersistTopic } from '@etk/persistence';
import type { ArticleType } from '@etk/core';

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

  // Topic-driven generation (Phase 2U): no product, always lands as a DRAFT.
  // Publishing is a separate gated step (tools/etk/publish-article.mjs) and is
  // never performed here — a generated draft with no safe hero image must stay
  // non-public until a human attaches one and records its source.
  await boss.work(QUEUES.generateTopicArticle, async ([job]) => {
    const data = (job?.data ?? {}) as Partial<GenerateTopicArticleJob>;
    if (!data.title || !data.articleType || !data.category) {
      logger.error('generate_topic_missing_fields', {
        hasTitle: Boolean(data.title), hasType: Boolean(data.articleType), hasCategory: Boolean(data.category),
      });
      return;
    }
    logger.info('generate_topic_start', { title: data.title, type: data.articleType });

    try {
      const saved = await generateAndPersistTopic(makeClient(), {
        ...(data as GenerateTopicArticleJob),
        articleType: data.articleType as ArticleType,
        category: data.category,
      });
      logger.info('generate_topic_done', {
        articleId: saved.articleId, slug: saved.articleSlug,
        markdownLength: saved.markdownLength, updated: saved.updated,
        editorialStatus: saved.editorialStatus, costCents: saved.costCents,
      });
    } catch (e) {
      logger.error('generate_topic_failed', { title: data.title, err: String(e) });
      throw e;
    }
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
