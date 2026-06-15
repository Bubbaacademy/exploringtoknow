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

const STEPS = [
  { n: '1', t: 'Researched, not scraped', d: 'Every guide starts from real product research and the questions readers actually ask — never spun from thin air.' },
  { n: '2', t: 'Drafted with AI assistance', d: 'We use AI to draft faster and stay structured, then hold every claim to a human standard.' },
  { n: '3', t: 'Human editorial review', d: 'Nothing is published until an editor has reviewed it. No auto-publishing, no sponsored rankings.' },
];

export default async function HomePage() {
  const [latest, categories] = await Promise.all([listPublishedArticles({ limit: 9 }), listActiveCategories()]);
  const featured = (await listPublishedArticles({ limit: 1, featured: true }))[0] as Doc | undefined;
  // Prefer a dedicated featured story; otherwise lead with the newest article.
  const cover = featured || (latest[0] as Doc | undefined);
  const coverCat = cover && typeof cover.category === 'object' ? (cover.category as Doc) : null;
  const grid = cover ? latest.filter((a) => a.id !== cover.id).slice(0, 8) : latest;

  return (
    <>
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
              <Link href="#latest" className="btn btn-lg">Read the latest guides</Link>
              <Link href="/request-product" className="btn btn-ghost btn-lg">Request a Review</Link>
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

      {/* Latest articles */}
      <section className="section" id="latest">
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Fresh off the desk</span>
              <h2>Latest guides</h2>
            </div>
            <Link href="/categories" className="section-link">Browse all categories →</Link>
          </div>
          {grid.length ? (
            <div className="grid">{grid.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          ) : (
            <div className="empty"><strong>No published guides yet</strong>New reviews are in editorial review — check back soon.</div>
          )}
        </div>
      </section>

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

      {/* Request a review */}
      <section className="section">
        <div className="container">
          <div className="promo">
            <div className="promo-inner">
              <span className="eyebrow">For readers &amp; brands</span>
              <h2>Want a specific product reviewed?</h2>
              <p>Submit a product and our editors will consider it for a hands-on guide. Every request is reviewed by a human — nothing is published automatically.</p>
              <div className="hero-actions">
                <Link href="/request-product" className="btn btn-accent btn-lg">Request a Review</Link>
                <Link href="/categories" className="btn btn-ghost btn-lg">Explore categories</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
