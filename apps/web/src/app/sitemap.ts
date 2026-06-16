import type { MetadataRoute } from 'next';
import { listPublishedArticles, listActiveCategories, listActiveAuthors, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

/** Sitemap contains ONLY editorially published articles + active categories/authors. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, authors] = await Promise.all([
    listPublishedArticles({ limit: 1000 }),
    listActiveCategories(),
    listActiveAuthors(),
  ]);
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/buying-guides`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/reviews`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/explore`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/request-product`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/editorial-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/affiliate-disclosure`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
  ];
  const cats: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`, changeFrequency: 'weekly', priority: 0.6,
  }));
  const arts: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/${a.slug}`,
    lastModified: a.editorialPublishedAt ? new Date(a.editorialPublishedAt) : undefined,
    changeFrequency: 'weekly', priority: 0.8,
  }));
  const auths: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${SITE_URL}/author/${a.slug}`, changeFrequency: 'monthly', priority: 0.3,
  }));
  return [...staticPages, ...cats, ...arts, ...auths];
}
