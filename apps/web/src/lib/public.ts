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

export async function relatedArticles(article: Doc, limit = 3): Promise<Doc[]> {
  const categoryId = typeof article.category === 'object' ? article.category?.id : article.category;
  const payload = await client();
  const and: Doc[] = [PUBLISHED_WHERE, { id: { not_equals: article.id } }];
  if (categoryId != null) and.push({ category: { equals: categoryId } });
  const res = await payload.find({ collection: 'articles', where: { and }, sort: '-editorialPublishedAt', limit, depth: 1 });
  return res.docs;
}

export const SITE_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://exploringtoknow.com';
export const SITE_NAME = 'ExploringToKnow';
export const AFFILIATE_DISCLOSURE =
  'ExploringToKnow is reader-supported. We may earn a commission when you buy through links on our site, at no extra cost to you.';
