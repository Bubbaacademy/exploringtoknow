import { runContentPipeline } from '@etk/ai';
import { registry } from '@etk/prompts';
import type { BrandProfile, ArticleType } from '@etk/core';
import { persistGeneration } from './persist';
import { toProductInput, mapBrandProfile } from './brand';
import type { PersistenceClient, PersistResult } from './types';

/**
 * End-to-end generate-and-persist for ONE existing product, identified by id.
 * Loads the product + brand profile through the client, runs the AI content
 * pipeline (mock unless a provider key is configured), then persists the result.
 * Shared by the worker (REST client) and the REST integration test.
 */
export async function generateAndPersist(
  client: PersistenceClient,
  input: { productId: string | number; articleType?: ArticleType },
  opts: { maxAttempts?: number } = {},
): Promise<PersistResult> {
  const doc = await client.findById('products', input.productId);
  if (!doc) throw new Error(`product ${input.productId} not found`);
  const product = toProductInput(doc);
  // Persist relationships with the RAW product id (numeric for the pg adapter);
  // toProductInput stringifies id for the pipeline, which the relationship rejects.
  const productId = doc.id;

  let brand: BrandProfile | undefined;
  try {
    brand = mapBrandProfile(await client.findGlobal('brand-profile'));
  } catch {
    brand = undefined; // pipeline falls back to DEFAULT_BRAND
  }

  const result = await runContentPipeline(product, brand, {
    maxAttempts: opts.maxAttempts ?? 2,
    articleType: input.articleType,
  });

  // Belt and braces: the brief node already steers the written piece, but the
  // stored Article.type is what drives the magazine's listing sections, so pin
  // it to what was actually asked for rather than trusting the model's echo.
  const article = result.state.article && input.articleType
    ? { ...result.state.article, type: input.articleType }
    : result.state.article;

  return persistGeneration(client, {
    productId,
    intelligence: result.state.intelligence,
    brief: result.state.brief,
    article,
    qa: result.state.qa
      ? { passed: result.state.qa.passed, reasons: result.state.qa.reasons }
      : undefined,
    cost: result.cost,
    articleAttempts: result.state.attempts.article,
    flagged: result.flagged,
    promptVersions: registry.list().map((p) => p.id),
  });
}
