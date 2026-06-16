import { getPayload } from 'payload';
import config from '@payload-config';

/** Public visibility is gated SOLELY by editorialStatus = 'published'. */
export const PUBLISHED_WHERE = { editorialStatus: { equals: 'published' } } as const;

export async function client() {
  return getPayload({ config });
}

export type Doc = Record<string, any>;

/** Resolve a Payload media relationship to a usable URL (or null). */
export function mediaUrl(rel: unknown): string | null {
  if (rel && typeof rel === 'object' && typeof (rel as Doc).url === 'string') return (rel as Doc).url;
  return null;
}

export async function listPublishedArticles(opts: { limit?: number; categoryId?: string | number; featured?: boolean } = {}): Promise<Doc[]> {
  const payload = await client();
  const and: Doc[] = [PUBLISHED_WHERE];
  if (opts.categoryId != null) and.push({ category: { equals: opts.categoryId } });
  if (opts.featured) and.push({ featured: { equals: true } });
  const res = await payload.find({
    collection: 'articles',
    where: { and },
    sort: '-editorialPublishedAt',
    limit: opts.limit ?? 12,
    depth: 1,
  });
  return res.docs;
}

export async function getPublishedArticle(slug: string): Promise<Doc | null> {
  const payload = await client();
  const res = await payload.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, PUBLISHED_WHERE] },
    limit: 1,
    depth: 2,
  });
  return res.docs[0] ?? null;
}

export async function listActiveCategories(): Promise<Doc[]> {
  const payload = await client();
  const res = await payload.find({ collection: 'categories', where: { active: { equals: true } }, sort: 'name', limit: 100, depth: 1 });
  return res.docs;
}

export async function getActiveCategory(slug: string): Promise<Doc | null> {
  const payload = await client();
  const res = await payload.find({
    collection: 'categories',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ?? null;
}

export async function countPublishedInCategory(categoryId: string | number): Promise<number> {
  const payload = await client();
  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED_WHERE, { category: { equals: categoryId } }] },
    limit: 0,
    depth: 0,
  });
  return res.totalDocs;
}

/**
 * Active categories with their PUBLISHED article counts (read-only, published-gated).
 * Sorted by count desc then name so topics with content surface first. Used by the
 * categories hub and explore discovery; never mutates or exposes non-public data.
 */
export async function listActiveCategoriesWithCounts(): Promise<Array<Doc & { articleCount: number }>> {
  const categories = await listActiveCategories();
  const counts = await Promise.all(categories.map((c) => countPublishedInCategory(c.id)));
  const enriched: Array<Doc & { articleCount: number }> = categories.map((c, i) => ({ ...c, articleCount: counts[i] ?? 0 }));
  enriched.sort((a, b) => b.articleCount - a.articleCount || String(a.name).localeCompare(String(b.name)));
  return enriched;
}

/**
 * Related published articles: same category first, then a safe fallback to other
 * published articles so the section is never empty when the category is thin.
 * Always excludes the current article and never returns duplicates or drafts.
 */
export async function relatedArticles(article: Doc, limit = 3): Promise<Doc[]> {
  const categoryId = typeof article.category === 'object' ? article.category?.id : article.category;
  const payload = await client();
  const out: Doc[] = [];
  const seen = new Set<unknown>([article.id]);

  if (categoryId != null) {
    const sameCat = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED_WHERE, { id: { not_equals: article.id } }, { category: { equals: categoryId } }] },
      sort: '-editorialPublishedAt', limit, depth: 1,
    });
    for (const d of sameCat.docs) {
      if (out.length >= limit) break;
      if (!seen.has(d.id)) { out.push(d); seen.add(d.id); }
    }
  }
  if (out.length < limit) {
    const more = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED_WHERE, { id: { not_equals: article.id } }] },
      sort: '-editorialPublishedAt', limit: limit + out.length + 4, depth: 1,
    });
    for (const d of more.docs) {
      if (out.length >= limit) break;
      if (!seen.has(d.id)) { out.push(d); seen.add(d.id); }
    }
  }
  return out.slice(0, limit);
}

/**
 * Deterministic "trending" ordering of PUBLISHED articles — featured first, then
 * most recent. No analytics and NO fabricated view counts; this is an honest
 * editorial ranking that stays correct as content grows. Drafts never included.
 */
export async function listTrendingArticles(limit = 6): Promise<Doc[]> {
  const payload = await client();
  const [featured, recent] = await Promise.all([
    payload.find({ collection: 'articles', where: { and: [PUBLISHED_WHERE, { featured: { equals: true } }] }, sort: '-editorialPublishedAt', limit, depth: 1 }),
    payload.find({ collection: 'articles', where: { and: [PUBLISHED_WHERE] }, sort: '-editorialPublishedAt', limit: limit * 2, depth: 1 }),
  ]);
  const out: Doc[] = [];
  const seen = new Set<unknown>();
  for (const d of [...featured.docs, ...recent.docs]) {
    if (out.length >= limit) break;
    if (!seen.has(d.id)) { out.push(d); seen.add(d.id); }
  }
  return out;
}

/** Published articles filtered by one or more `type` values (for nav listing pages). */
export async function listPublishedArticlesByTypes(types: string[], opts: { limit?: number } = {}): Promise<Doc[]> {
  const payload = await client();
  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED_WHERE, { type: { in: types } }] },
    sort: '-editorialPublishedAt',
    limit: opts.limit ?? 48,
    depth: 1,
  });
  return res.docs;
}

export const SEARCH_MAX_QUERY = 100;
export const SEARCH_MIN_QUERY = 2;
export const SEARCH_LIMIT = 24;

/**
 * Native server-side search over PUBLISHED articles only. The query is trimmed and
 * length-capped; matching uses Payload's parameterized `like` (ILIKE) operator —
 * never raw string concatenation. Results are AND-gated by editorialStatus, so
 * drafts / ready_for_review / rejected content can never appear. Falls back to
 * native-field matching if the relationship-join match is unsupported, so the
 * route never 500s.
 */
export async function searchPublishedArticles(
  rawQuery: string,
  limit = SEARCH_LIMIT,
): Promise<{ docs: Doc[]; total: number; query: string; capped: boolean }> {
  const trimmed = (rawQuery || '').trim();
  const query = trimmed.slice(0, SEARCH_MAX_QUERY);
  const capped = trimmed.length > SEARCH_MAX_QUERY;
  if (query.length < SEARCH_MIN_QUERY) return { docs: [], total: 0, query, capped };

  const payload = await client();
  const nativeOr: Doc[] = [
    { title: { like: query } },
    { excerpt: { like: query } },
    { slug: { like: query } },
    { markdown: { like: query } },
  ];
  const relationOr: Doc[] = [
    { 'category.name': { like: query } },
    { 'product.title': { like: query } },
  ];

  try {
    const res = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED_WHERE, { or: [...nativeOr, ...relationOr] }] },
      sort: '-editorialPublishedAt', limit, depth: 1,
    });
    return { docs: res.docs, total: res.totalDocs, query, capped };
  } catch {
    // Defensive fallback: query only native article fields (no relationship join).
    const res = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED_WHERE, { or: nativeOr }] },
      sort: '-editorialPublishedAt', limit, depth: 1,
    });
    return { docs: res.docs, total: res.totalDocs, query, capped };
  }
}

/**
 * Resolve an article's affiliate offer from MANUALLY-entered product data.
 * Returns null when there is no affiliate/external URL — the affiliate URL is
 * always read from stored data, never discovered or modified.
 */
export function getArticleAffiliate(article: Doc): { product: Doc; url: string } | null {
  const product = typeof article.product === 'object' ? (article.product as Doc) : null;
  const url = product?.affiliateUrl || product?.externalUrl;
  if (!product || !url) return null;
  return { product, url };
}

export const SITE_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://exploringtoknow.com';
export const SITE_NAME = 'ExploringToKnow';
export const AFFILIATE_DISCLOSURE =
  'ExploringToKnow is reader-supported. We may earn a commission when you buy through links on our site, at no extra cost to you.';
/** In-article disclosure shown near the top of articles with an affiliate relationship. */
export const ARTICLE_AFFILIATE_DISCLOSURE =
  'ExploringToKnow may earn a commission from qualifying purchases. Our editorial recommendations remain independent.';
