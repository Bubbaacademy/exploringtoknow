import type { MetadataRoute } from 'next';
import { listPublishedArticles, listActiveCategories, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

/** Sitemap contains ONLY editorially published articles + active categories. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    listPublishedArticles({ limit: 1000 }),
    listActiveCategories(),
  ]);
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/request-product`, changeFrequency: 'monthly', priority: 0.4 },
  ];
  const cats: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`, changeFrequency: 'weekly', priority: 0.6,
  }));
  const arts: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/${a.slug}`,
    lastModified: a.editorialPublishedAt ? new Date(a.editorialPublishedAt) : undefined,
    changeFrequency: 'weekly', priority: 0.8,
  }));
  return [...staticPages, ...cats, ...arts];
}
