import type { PersistenceClient, GenerationOutcome, PersistResult } from './types';

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/(^-|-$)/g, '');
}

/** Return the first slug of the form `base`, `base-2`, … not already taken. */
export async function freeSlug(client: PersistenceClient, base: string): Promise<string> {
  let slug = base || 'article';
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while ((await client.find('articles', { slug: { equals: slug } })).totalDocs > 0) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/**
 * Persist a completed generation to Payload: the generation-runs ledger row plus
 * the product-intelligence, content-briefs, and articles documents (linked to an
 * EXISTING product). Backend-agnostic — runs over the Payload Local API
 * (validation harness) or REST (worker). This is the single source of truth for
 * the persistence shape, extracted from the original validateOneArticle.
 */
export async function persistGeneration(
  client: PersistenceClient,
  outcome: GenerationOutcome,
): Promise<PersistResult> {
  if (!outcome.article) throw new Error('persistGeneration: no article to persist');
  const passed = Boolean(outcome.qa?.passed);
  const now = () => new Date().toISOString();
  const intelModel = outcome.cost.steps.find((x) => x.label === 'intelligence')?.model;

  const run = await client.create('generation-runs', {
    product: outcome.productId,
    status: 'running',
    startedAt: now(),
    promptVersions: outcome.promptVersions ?? [],
  });

  const intel = await client.create('product-intelligence', {
    product: outcome.productId,
    ...(outcome.intelligence ?? {}),
    model: intelModel,
    generatedAt: now(),
  });

  const brief = await client.create('content-briefs', {
    product: outcome.productId,
    intelligence: intel.id,
    ...(outcome.brief ?? {}),
    status: 'ready',
  });

  const article = outcome.article;
  const slug = await freeSlug(client, slugify(article.title));
  const articleDoc = await client.create('articles', {
    title: article.title,
    slug,
    brief: brief.id,
    product: outcome.productId,
    type: article.type,
    markdown: article.markdown,
    seo: { metaTitle: article.metaTitle, metaDescription: article.metaDescription },
    openGraph: { title: article.title, description: article.metaDescription },
    qaReport: { passed, reasons: outcome.qa?.reasons ?? [] },
    status: passed ? 'published' : 'flagged',
    publishedAt: passed ? now() : undefined,
  });

  await client.update('generation-runs', run.id, {
    status: outcome.flagged ? 'flagged' : passed ? 'published' : 'failed',
    articleAttempts: outcome.articleAttempts,
    totalTokens: outcome.cost.totalTokens,
    costUsdCents: outcome.cost.totalCents,
    steps: outcome.cost.steps,
    finishedAt: now(),
  });

  return {
    runId: run.id,
    intelligenceId: intel.id,
    briefId: brief.id,
    articleId: articleDoc.id,
    articleSlug: slug,
    articleStatus: passed ? 'published' : 'flagged',
    passed,
  };
}
