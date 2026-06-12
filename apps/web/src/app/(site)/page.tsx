import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticles, listActiveCategories, mediaUrl, SITE_NAME, SITE_URL, type Doc } from '@/lib/public';
import { ArticleCard } from '@/components/site/ArticleCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Honest buying guides & reviews`,
  description: 'Reader-supported buying guides, reviews, and practical fixes. Manually researched, editorially reviewed.',
  alternates: { canonical: SITE_URL },
  openGraph: { title: SITE_NAME, description: 'Honest buying guides & reviews.', type: 'website', url: SITE_URL },
};

export default async function HomePage() {
  const [latest, categories] = await Promise.all([listPublishedArticles({ limit: 9 }), listActiveCategories()]);
  const featured = (await listPublishedArticles({ limit: 1, featured: true }))[0] as Doc | undefined;

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="eyebrow">Reader-supported reviews</div>
          <h1>Practical buying guides, without the hype.</h1>
          <p>Manually researched products, AI-assisted drafting, and a human editorial review before anything goes live.</p>
          <Link href="/request-product" className="btn btn-accent">Request a product review</Link>
        </div>
      </section>

      {featured ? (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2>Featured</h2></div>
            <Link href={`/${featured.slug}`} className="card" style={{ flexDirection: 'row' }}>
              <div className="thumb" style={{ flex: '0 0 46%', aspectRatio: 'auto' }}>
                {mediaUrl(featured.images?.hero)
                  ? <img src={mediaUrl(featured.images?.hero)!} alt={featured.images?.heroAlt || featured.title} loading="lazy" />
                  : <span>ExploringToKnow</span>}
              </div>
              <div className="body" style={{ justifyContent: 'center' }}>
                <h3 style={{ fontSize: 22 }}>{featured.title}</h3>
                {featured.excerpt ? <p>{String(featured.excerpt).slice(0, 200)}</p> : null}
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>Latest articles</h2><Link href="/categories" className="meta">Browse categories →</Link></div>
          {latest.length ? (
            <div className="grid">{latest.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          ) : (
            <p className="meta">No published articles yet — check back soon.</p>
          )}
        </div>
      </section>

      {categories.length ? (
        <section className="section">
          <div className="container">
            <div className="section-head"><h2>Categories</h2></div>
            <div className="grid">
              {categories.map((c) => (
                <Link key={String(c.id)} href={`/category/${c.slug}`} className="card">
                  <div className="thumb">{mediaUrl(c.image) ? <img src={mediaUrl(c.image)!} alt={c.name} loading="lazy" /> : <span>{c.name}</span>}</div>
                  <div className="body"><h3>{c.name}</h3>{c.description ? <p>{String(c.description).slice(0, 120)}</p> : null}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className="disclosure" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span>Want us to review a specific product? Submit it for editorial review.</span>
            <Link href="/request-product" className="btn">Request a product</Link>
          </div>
        </div>
      </section>
    </>
  );
}
