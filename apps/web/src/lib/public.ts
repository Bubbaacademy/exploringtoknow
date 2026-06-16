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

/**
 * Real "most read" from first-party analytics (article_views), published-only.
 * Sums per-article view counts within the window, returns top published articles
 * ordered by views. Returns [] when there is no data — callers fall back to the
 * deterministic trending ranking (never fabricated counts).
 */
export async function listMostReadArticles(days = 30, limit = 6): Promise<Doc[]> {
  const payload = await client();
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const views = await payload.find({
    collection: 'article-views',
    where: { viewDate: { greater_than_equal: since } },
    limit: 5000, depth: 0,
  });
  if (!views.docs.length) return [];
  const totals = new Map<string | number, number>();
  for (const v of views.docs) {
    const aid = typeof v.article === 'object' ? (v.article as Doc)?.id : v.article;
    if (aid == null) continue;
    totals.set(aid, (totals.get(aid) ?? 0) + Number(v.count || 0));
  }
  const topIds = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 2).map(([id]) => id);
  if (!topIds.length) return [];
  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED_WHERE, { id: { in: topIds } }] },
    depth: 1, limit: limit * 2,
  });
  return res.docs
    .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0))
    .slice(0, limit);
}

export async function listActiveAuthors(): Promise<Doc[]> {
  const payload = await client();
  const res = await payload.find({ collection: 'authors', where: { active: { equals: true } }, sort: 'name', limit: 100, depth: 0 });
  return res.docs;
}

/**
 * Admin analytics aggregation: per-article 7-day / 30-day / all-time view totals
 * from first-party article_views. Internal (dashboard) use — includes article
 * status/category/author for triage. Returns [] when there is no data.
 */
export async function getMostReadDashboard(limit = 50): Promise<Array<{ article: Doc; v7: number; v30: number; vAll: number }>> {
  const payload = await client();
  const now = Date.now();
  const d7 = new Date(now - 7 * 86_400_000).toISOString().slice(0, 10);
  const d30 = new Date(now - 30 * 86_400_000).toISOString().slice(0, 10);
  const views = await payload.find({ collection: 'article-views', limit: 10_000, depth: 0 });
  if (!views.docs.length) return [];
  const agg = new Map<string | number, { v7: number; v30: number; vAll: number }>();
  for (const v of views.docs) {
    const aid = typeof v.article === 'object' ? (v.article as Doc)?.id : v.article;
    if (aid == null) continue;
    const c = Number(v.count || 0);
    const date = String(v.viewDate || '');
    const e = agg.get(aid) ?? { v7: 0, v30: 0, vAll: 0 };
    e.vAll += c;
    if (date >= d30) e.v30 += c;
    if (date >= d7) e.v7 += c;
    agg.set(aid, e);
  }
  const ids = [...agg.keys()];
  const arts = await payload.find({ collection: 'articles', where: { id: { in: ids } }, depth: 1, limit: ids.length });
  const byId = new Map(arts.docs.map((a) => [a.id, a]));
  return [...agg.entries()]
    .map(([id, e]) => ({ article: byId.get(id) as Doc, ...e }))
    .filter((r) => r.article)
    .sort((a, b) => b.vAll - a.vAll || (new Date(String(b.article.editorialPublishedAt || 0)).getTime()) - (new Date(String(a.article.editorialPublishedAt || 0)).getTime()))
    .slice(0, limit);
}

/**
 * Admin-only operational overview (counts + recent intake). Internal dashboard use.
 * Read-only aggregation; no PII beyond what admins already see in collections.
 */
export async function getAdminOverview(): Promise<{
  counts: Record<string, number>;
  recentContacts: Doc[];
  recentRequests: Doc[];
}> {
  const payload = await client();
  const count = async (collection: string, where: Doc): Promise<number> =>
    (await payload.find({ collection: collection as never, where, limit: 0, depth: 0 })).totalDocs;
  const [published, drafts, review, categories, authors, subscribers, subsActive, contactsNew, requestsOpen, mediaCount] = await Promise.all([
    count('articles', { editorialStatus: { equals: 'published' } }),
    count('articles', { editorialStatus: { equals: 'draft' } }),
    count('articles', { editorialStatus: { equals: 'ready_for_review' } }),
    count('categories', { active: { equals: true } }),
    count('authors', {}),
    count('newsletter-subscribers', {}),
    count('newsletter-subscribers', { status: { in: ['active', 'subscribed'] } }),
    count('contact-messages', { status: { equals: 'new' } }),
    count('product-requests', { status: { equals: 'submitted' } }),
    count('media', {}),
  ]);
  const viewsAgg = await payload.find({ collection: 'article-views', limit: 10_000, depth: 0 });
  const totalViews = viewsAgg.docs.reduce((s, v) => s + Number(v.count || 0), 0);
  // Pipeline counts (editorial overview).
  const [requestsApproved, requestsProcessing, runsRunning, runsPublished, runsFlagged, runsFailed] = await Promise.all([
    count('product-requests', { status: { equals: 'approved' } }),
    count('product-requests', { status: { equals: 'processing' } }),
    count('generation-runs', { status: { equals: 'running' } }),
    count('generation-runs', { status: { equals: 'published' } }),
    count('generation-runs', { status: { equals: 'flagged' } }),
    count('generation-runs', { status: { equals: 'failed' } }),
  ]);
  // Warnings — resilient: any unsupported `exists` path falls back to 0, never 500s.
  let warnPubNoCategory = 0, warnPubNoAuthor = 0, warnPubNoHero = 0, warnReviewNoCategory = 0;
  try {
    [warnPubNoCategory, warnPubNoAuthor, warnPubNoHero, warnReviewNoCategory] = await Promise.all([
      count('articles', { and: [{ editorialStatus: { equals: 'published' } }, { category: { exists: false } }] }),
      count('articles', { and: [{ editorialStatus: { equals: 'published' } }, { author: { exists: false } }] }),
      count('articles', { and: [{ editorialStatus: { equals: 'published' } }, { 'images.hero': { exists: false } }] }),
      count('articles', { and: [{ editorialStatus: { equals: 'ready_for_review' } }, { category: { exists: false } }] }),
    ]);
  } catch {
    /* leave warnings at 0 if a query operator is unsupported */
  }
  const [recentContacts, recentRequests] = await Promise.all([
    payload.find({ collection: 'contact-messages', sort: '-createdAt', limit: 5, depth: 0 }),
    payload.find({ collection: 'product-requests', sort: '-submittedAt', limit: 5, depth: 0 }),
  ]);
  return {
    counts: {
      published, drafts, review, categories, authors, subscribers, subsActive, contactsNew, requestsOpen, media: mediaCount, totalViews,
      requestsApproved, requestsProcessing, runsRunning, runsPublished, runsFlagged, runsFailed,
      warnPubNoCategory, warnPubNoAuthor, warnPubNoHero, warnReviewNoCategory,
    },
    recentContacts: recentContacts.docs,
    recentRequests: recentRequests.docs,
  };
}

export async function getActiveAuthor(slug: string): Promise<Doc | null> {
  const payload = await client();
  const res = await payload.find({
    collection: 'authors',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1, depth: 1,
  });
  return res.docs[0] ?? null;
}

export async function listPublishedArticlesByAuthor(authorId: string | number, limit = 24): Promise<Doc[]> {
  const payload = await client();
  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED_WHERE, { author: { equals: authorId } }] },
    sort: '-editorialPublishedAt', limit, depth: 1,
  });
  return res.docs;
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
 * Relevance score for a published article against a query. Field-weighted so title
 * matches rank highest, then excerpt, then category/author, then body. Pure ranking
 * over already-published results — it never changes which articles are eligible.
 */
function scoreArticle(a: Doc, q: string): number {
  const ql = q.toLowerCase();
  const has = (s: unknown) => (typeof s === 'string' ? s.toLowerCase().includes(ql) : false);
  const title = typeof a.title === 'string' ? a.title.toLowerCase() : '';
  let score = 0;
  if (title.includes(ql)) score += 100;
  if (title.startsWith(ql)) score += 50;
  if (title === ql) score += 50;
  if (has(a.excerpt)) score += 40;
  const cat = typeof a.category === 'object' ? (a.category as Doc)?.name : a.category;
  if (has(cat)) score += 25;
  const author = typeof a.author === 'object' ? (a.author as Doc)?.name : undefined;
  if (has(author)) score += 25;
  const product = typeof a.product === 'object' ? (a.product as Doc)?.title : undefined;
  if (has(product)) score += 20;
  if (has(a.slug)) score += 15;
  if (has(a.markdown)) score += 10;
  return score;
}

function rankSearchResults(docs: Doc[], query: string): Doc[] {
  return [...docs].sort((a, b) => {
    const d = scoreArticle(b, query) - scoreArticle(a, query);
    if (d !== 0) return d;
    return new Date(String(b.editorialPublishedAt || 0)).getTime() - new Date(String(a.editorialPublishedAt || 0)).getTime();
  });
}

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
    return { docs: rankSearchResults(res.docs, query), total: res.totalDocs, query, capped };
  } catch {
    // Defensive fallback: query only native article fields (no relationship join).
    const res = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED_WHERE, { or: nativeOr }] },
      sort: '-editorialPublishedAt', limit, depth: 1,
    });
    return { docs: rankSearchResults(res.docs, query), total: res.totalDocs, query, capped };
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
