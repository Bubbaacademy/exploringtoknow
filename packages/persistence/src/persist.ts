import type { PersistenceClient, GenerationOutcome, PersistResult } from './types';

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/(^-|-$)/g, '');
}

/**
 * Authoritative, deterministic article category resolution from existing
 * structured data — NO AI / free-text guessing. The linked Product's
 * `categories` already carry the Product Request's `requestedCategory`
 * (propagated at request approval), so the first product category is the
 * single source of truth for the generated article's category.
 */
export function firstCategoryId(product: { categories?: unknown } | null | undefined): string | number | null {
  const cats = product?.categories;
  if (!Array.isArray(cats) || cats.length === 0) return null;
  const c = cats[0];
  if (c == null) return null;
  return typeof c === 'object' ? ((c as { id?: string | number }).id ?? null) : (c as string | number);
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

  // Resolve the category deterministically from the linked Product (which
  // already carries the Product Request's requestedCategory). Set it in the
  // SAME create call — no create-then-self-update. If unresolved, the article
  // is created without a category and the editorial gate (publish validation)
  // keeps it unpublishable until an admin assigns one.
  const product = await client.findById('products', outcome.productId);
  const categoryId = firstCategoryId(product as { categories?: unknown } | null);

  const articleDoc = await client.create('articles', {
    title: article.title,
    slug,
    brief: brief.id,
    product: outcome.productId,
    ...(categoryId != null ? { category: categoryId } : {}),
    type: article.type,
    markdown: article.markdown,
    excerpt: article.metaDescription,
    seo: { metaTitle: article.metaTitle, metaDescription: article.metaDescription },
    openGraph: { title: article.title, description: article.metaDescription },
    qaReport: { passed, reasons: outcome.qa?.reasons ?? [] },
    status: passed ? 'published' : 'flagged',
    // Editorial gate: generation NEVER auto-publishes. A clean run lands at
    // ready_for_review for an administrator to publish manually.
    editorialStatus: passed ? 'ready_for_review' : 'draft',
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
