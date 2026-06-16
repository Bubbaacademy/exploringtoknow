import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getActiveCategory,
  listPublishedArticles,
  countPublishedInCategory,
  listActiveCategoriesWithCounts,
  SITE_NAME,
  SITE_URL,
} from '@/lib/public';
import { CTA } from '@/lib/nav';
import { ArticleCard } from '@/components/site/ArticleCard';
import { TopicChips } from '@/components/site/TopicChips';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const c = await getActiveCategory(slug);
  if (!c) return { title: 'Not found', robots: { index: false } };
  const seo = (c.seo ?? {}) as { seoTitle?: string; seoDescription?: string };
  return {
    title: seo.seoTitle || `${c.name} — ${SITE_NAME}`,
    description: seo.seoDescription || c.description || `Independent ${c.name} buying guides and reviews from ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/category/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params;
  const category = await getActiveCategory(slug);
  if (!category) notFound();

  const [articles, count] = await Promise.all([
    listPublishedArticles({ categoryId: category.id, limit: 48 }),
    countPublishedInCategory(category.id),
  ]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/category/${category.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* Masthead */}
      <section className="cat-masthead">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> / <Link href="/categories">Topics</Link> /{' '}
            <span aria-current="page">{category.name as string}</span>
          </nav>
          <span className="eyebrow">Topic</span>
          <h1>{category.name as string}</h1>
          {category.description ? <p className="cat-masthead-desc">{category.description as string}</p> : null}
          <div className="cat-masthead-meta">
            <span>{count} {count === 1 ? 'guide' : 'guides'}</span>
            <span>Independently researched</span>
            <span>Human-reviewed before publishing</span>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {articles.length ? (
            <div className="grid">{articles.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          ) : (
            <CategoryEmptyState currentSlug={category.slug as string} categoryName={category.name as string} />
          )}
        </div>
      </section>
    </>
  );
}

async function CategoryEmptyState({ currentSlug, categoryName }: { currentSlug: string; categoryName: string }) {
  const others = (await listActiveCategoriesWithCounts())
    .filter((c) => c.slug !== currentSlug && c.articleCount > 0)
    .slice(0, 8);
  return (
    <div className="empty-panel">
      <span className="eyebrow">Coming soon</span>
      <h2>No {categoryName} guides published yet</h2>
      <p>Our editors are researching this topic. Nothing is published until a human has reviewed it — so check back soon, or explore topics with fresh guides below.</p>
      {others.length ? (
        <>
          <div className="empty-panel-sub">Explore other topics</div>
          <TopicChips categories={others} showCount />
        </>
      ) : null}
      <div className="empty-panel-actions">
        <Link href="/categories" className="btn btn-ghost">Browse all topics</Link>
        <Link href={CTA.href} className="btn btn-accent">{CTA.label}</Link>
      </div>
    </div>
  );
}
