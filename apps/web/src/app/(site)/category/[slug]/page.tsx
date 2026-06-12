import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveCategory, listPublishedArticles, SITE_NAME, SITE_URL } from '@/lib/public';
import { ArticleCard } from '@/components/site/ArticleCard';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const c = await getActiveCategory(slug);
  if (!c) return { title: 'Not found', robots: { index: false } };
  const seo = (c.seo ?? {}) as { seoTitle?: string; seoDescription?: string };
  return {
    title: seo.seoTitle || `${c.name} — ${SITE_NAME}`,
    description: seo.seoDescription || c.description || undefined,
    alternates: { canonical: `${SITE_URL}/category/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params;
  const category = await getActiveCategory(slug);
  if (!category) notFound();
  const articles = await listPublishedArticles({ categoryId: category.id, limit: 48 });
  return (
    <section className="section">
      <div className="container">
        <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/categories">Categories</Link> / {category.name}</div>
        <h1>{category.name}</h1>
        {category.description ? <p className="meta" style={{ maxWidth: 640 }}>{category.description}</p> : null}
        {articles.length ? (
          <div className="grid" style={{ marginTop: 16 }}>{articles.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
        ) : <p className="meta" style={{ marginTop: 16 }}>No published articles in this category yet.</p>}
      </div>
    </section>
  );
}
