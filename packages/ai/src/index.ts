import type { ProductInput, BrandProfile } from '@etk/core';
import { DEFAULT_BRAND } from '@etk/core';
import { CostMeter } from '@etk/providers';
import { buildContentGraph } from './graphs/contentPipeline';
import { buildRefreshGraph } from './graphs/refresh';
import type { ContentState } from './state';

export { buildContentGraph, buildRefreshGraph };
export type { ContentState } from './state';

export interface PipelineResult {
  state: ContentState;
  published: boolean;        // passed QA (ready to publish downstream)
  flagged: boolean;
  cost: ReturnType<CostMeter['report']>;
}

/**
 * Seed state from a product and run the content pipeline end-to-end.
 * Used by the worker (generate-content job) and the example script.
 * `maxAttempts` bounds the regeneration loop.
 */
export async function runContentPipeline(
  product: ProductInput,
  brand: BrandProfile = DEFAULT_BRAND,
  opts: { maxAttempts?: number } = {},
): Promise<PipelineResult> {
  const graph = buildContentGraph();
  const final = (await graph.invoke({
    product,
    brand,
    attempts: { article: 0, max: opts.maxAttempts ?? 2 },
    cost: [],
  })) as ContentState;

  const meter = new CostMeter();
  for (const s of final.cost) meter.record(s.label, s.model, { inputTokens: s.inputTokens, outputTokens: s.outputTokens });

  return {
    state: final,
    published: Boolean(final.qa?.passed),
    flagged: Boolean(final.flagged),
    cost: meter.report(),
  };
}
