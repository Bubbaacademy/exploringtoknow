import type PgBoss from 'pg-boss';
import { logger, type ProductInput } from '@etk/core';
import { runContentPipeline } from '@etk/ai';
import { QUEUES, type GenerateContentJob } from '@etk/queue';

/**
 * Worker handlers.
 *  - daily-pipeline: (Phase 4) selects active products by priority and fans out.
 *  - generate-content: runs the real AI pipeline (intelligence → brief → article
 *    → quality gate → regeneration) for one product, behind provider abstractions.
 *    NOTE: loading the full product from the catalog and persisting outputs back
 *    to Payload is the next integration step; for now the job seeds a ProductInput
 *    from its payload (the force-generate route can pass product fields).
 */
export async function registerJobs(boss: PgBoss): Promise<void> {
  await boss.work(QUEUES.dailyPipeline, async () => {
    logger.info('daily_pipeline_tick');
  });

  await boss.work(QUEUES.generateContent, async ([job]) => {
    const data = (job?.data ?? {}) as Partial<GenerateContentJob> & { product?: ProductInput };
    const product: ProductInput = data.product ?? {
      id: data.productId ?? 'unknown',
      title: 'Sample Product',
      offerType: 'owned_amazon',
    };
    logger.info('generate_content_start', { productId: product.id, trigger: data.trigger });

    const result = await runContentPipeline(product, undefined, { maxAttempts: 2 });

    logger.info('generate_content_done', {
      productId: product.id,
      published: result.published,
      flagged: result.flagged,
      articleAttempts: result.state.attempts.article,
      totalTokens: result.cost.totalTokens,
      costUsdCents: result.cost.totalCents,
    });
    // TODO(next): persist intelligence/brief/article + this cost report to Payload
    // (product-intelligence, content-briefs, articles, generation-runs collections).
  });
}
