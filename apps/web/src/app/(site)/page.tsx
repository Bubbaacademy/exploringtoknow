import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticles, listActiveCategories, listTrendingArticles, listMostReadArticles, mediaUrl, SITE_NAME, SITE_URL, type Doc } from '@/lib/public';
import { ArticleCard } from '@/components/site/ArticleCard';
import { NewsletterSignup } from '@/components/site/NewsletterSignup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Honest buying guides & reviews`,
  description: 'Reader-supported buying guides, reviews, and practical fixes. Manually researched, editorially reviewed.',
  alternates: { canonical: SITE_URL },
  openGraph: { title: SITE_NAME, description: 'Honest buying guides & reviews.', type: 'website', url: SITE_URL },
};

const STEPS = [
  { n: '1', t: 'Researched, not scraped', d: 'Every guide starts from real product research and the questions readers actually ask — never spun from thin air.' },
  { n: '2', t: 'Drafted with AI assistance', d: 'We use AI to draft faster and stay structured, then hold every claim to a human standard.' },
  { n: '3', t: 'Human editorial review', d: 'Nothing is published until an editor has reviewed it. No auto-publishing, no sponsored rankings.' },
];

export default async function HomePage() {
  const [latest, categories] = await Promise.all([
    listPublishedArticles({ limit: 12 }),
    listActiveCategories(),
  ]);
  // Real "most read" from first-party analytics when data exists; otherwise an
  // honest deterministic ranking (featured + recency) — never fabricated counts.
  const mostRead = await listMostReadArticles(30, 6);
  const trendingAll = mostRead.length ? mostRead : await listTrendingArticles(6);
  const featured = (await listPublishedArticles({ limit: 1, featured: true }))[0] as Doc | undefined;
  // Prefer a dedicated featured story; otherwise lead with the newest article.
  const cover = featured || (latest[0] as Doc | undefined);
  const coverCat = cover && typeof cover.category === 'object' ? (cover.category as Doc) : null;
  // Trending: deterministic (featured + recency), excluding the cover. No fake views.
  const trending = trendingAll.filter((a) => a.id !== cover?.id).slice(0, 6);
  const trendingIds = new Set(trending.map((t) => t.id));
  // Latest: anything not already shown as cover or trending (hidden when empty).
  const grid = latest.filter((a) => a.id !== cover?.id && !trendingIds.has(a.id)).slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, description: 'Independent buying guides and product reviews.' },
      {
        '@type': 'WebSite', name: SITE_NAME, url: SITE_URL,
        potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">Independent buying guides</span>
            <h1>Practical buying guides, <em>without the hype</em>.</h1>
            <p className="lede">
              Clear, trustworthy reviews that help you choose well — manually researched,
              AI-assisted in the drafting, and human-reviewed before anything goes live.
            </p>
            <div className="hero-actions">
              <Link href="/explore" className="btn btn-lg">Read the latest guides</Link>
              <Link href="/buying-guides" className="btn btn-ghost btn-lg">Browse buying guides</Link>
            </div>
            <div className="hero-trust">
              <span>Manually researched</span>
              <span>Human-reviewed</span>
              <span>No sponsored rankings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cover story */}
      {cover ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">{featured ? 'Featured' : 'Latest story'}</span>
                <h2>The cover story</h2>
              </div>
            </div>
            <Link href={`/${cover.slug}`} className="cover" aria-label={cover.title as string}>
              <div className="cover-media">
                {mediaUrl(cover.images?.hero)
                  ? <img src={mediaUrl(cover.images?.hero)!} alt={(cover.images?.heroAlt as string) || (cover.title as string)} />
                  : <span>ExploringToKnow</span>}
              </div>
              <div className="cover-body">
                {coverCat ? <span className="cat">{coverCat.name as string}</span> : null}
                <h3>{cover.title as string}</h3>
                {cover.excerpt ? <p>{String(cover.excerpt).slice(0, 220)}</p> : null}
                <span className="cover-cta">Read the guide →</span>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Trending / Most read (deterministic — featured + recency) */}
      {trending.length ? (
        <section className="section" id="trending" style={{ paddingTop: cover ? 0 : undefined }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Worth reading now</span>
                <h2>Trending guides</h2>
              </div>
              <Link href="/explore" className="section-link">Explore more →</Link>
            </div>
            <div className="grid">{trending.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* Latest articles (only when there are extras beyond cover + trending) */}
      {grid.length ? (
        <section className="section" id="latest" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Fresh off the desk</span>
                <h2>Latest guides</h2>
              </div>
              <Link href="/categories" className="section-link">Browse all categories →</Link>
            </div>
            <div className="grid">{grid.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* Categories */}
      {categories.length ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Find your topic</span>
                <h2>Browse by category</h2>
              </div>
            </div>
            <div className="cat-chips">
              {categories.map((c) => (
                <Link key={String(c.id)} href={`/category/${c.slug}`} className="cat-chip">
                  <span className="dot" aria-hidden="true">{String(c.name).trim().charAt(0).toUpperCase()}</span>
                  {c.name as string}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* How we work / trust */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Why you can trust us</span>
              <h2>How every guide is made</h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.n} className="step">
                <div className="step-num" aria-hidden="true">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <NewsletterSignup source="homepage" variant="section" />
        </div>
      </section>
    </>
  );
}
