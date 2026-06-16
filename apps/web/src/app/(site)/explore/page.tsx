import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listPublishedArticles,
  listActiveCategoriesWithCounts,
  mediaUrl,
  SITE_NAME,
  SITE_URL,
  type Doc,
} from '@/lib/public';
import { CTA } from '@/lib/nav';
import { ArticleCard } from '@/components/site/ArticleCard';
import { TopicChips } from '@/components/site/TopicChips';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Explore — ${SITE_NAME}`,
  description: 'Discover ExploringToKnow — featured guides, the latest reviews, and topics worth exploring. Independent, human-reviewed, never auto-published.',
  alternates: { canonical: `${SITE_URL}/explore` },
};

function EntryCards() {
  return (
    <div className="entry-cards">
      <Link href="/buying-guides" className="entry-card">
        <span className="eyebrow">Choose with confidence</span>
        <h3>Buying Guides</h3>
        <p>In-depth guides that compare options and explain what actually matters.</p>
        <span className="entry-card-cta">Explore guides →</span>
      </Link>
      <Link href="/reviews" className="entry-card">
        <span className="eyebrow">Tested &amp; considered</span>
        <h3>Product Reviews</h3>
        <p>Honest, hands-on reviews — no sponsored rankings, no hype.</p>
        <span className="entry-card-cta">Read reviews →</span>
      </Link>
    </div>
  );
}

export default async function ExplorePage() {
  const [featured, latest, cats] = await Promise.all([
    listPublishedArticles({ featured: true, limit: 1 }),
    listPublishedArticles({ limit: 13 }),
    listActiveCategoriesWithCounts(),
  ]);
  const cover = (featured[0] as Doc | undefined) || (latest[0] as Doc | undefined);
  const coverCat = cover && typeof cover.category === 'object' ? (cover.category as Doc) : null;
  const grid = cover ? latest.filter((a) => a.id !== cover.id).slice(0, 12) : latest;
  const topicsForChips = [...cats].sort((a, b) => b.articleCount - a.articleCount);

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="hub-head">
            <span className="eyebrow">Discover</span>
            <h1>Explore ExploringToKnow</h1>
            <p className="hub-head-desc">Featured guides, the latest reviews, and topics worth exploring — all manually researched and human-reviewed.</p>
          </div>

          {/* Featured / newest */}
          {cover ? (
            <Link href={`/${cover.slug}`} className="cover" aria-label={cover.title as string}>
              <div className="cover-media">
                {mediaUrl(cover.images?.hero)
                  ? <img src={mediaUrl(cover.images?.hero)!} alt={(cover.images?.heroAlt as string) || (cover.title as string)} />
                  : <span>ExploringToKnow</span>}
              </div>
              <div className="cover-body">
                <span className="eyebrow">{featured.length ? 'Featured guide' : 'Latest guide'}</span>
                {coverCat ? <span className="cat">{coverCat.name as string}</span> : null}
                <h3>{cover.title as string}</h3>
                {cover.excerpt ? <p>{String(cover.excerpt).slice(0, 220)}</p> : null}
                <span className="cover-cta">Read the guide →</span>
              </div>
            </Link>
          ) : (
            <div className="empty-panel">
              <span className="eyebrow">Coming soon</span>
              <h2>Fresh guides are on the way</h2>
              <p>Nothing is published until a human editor has reviewed it. Explore topics below or request a review.</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest guides */}
      {grid.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Fresh off the desk</span>
                <h2>Latest guides</h2>
              </div>
              <Link href="/buying-guides" className="section-link">All buying guides →</Link>
            </div>
            <div className="grid">{grid.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* Browse by topic */}
      <section className="section" style={{ paddingTop: grid.length ? 0 : undefined }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Find your topic</span>
              <h2>Browse by topic</h2>
            </div>
            <Link href="/categories" className="section-link">View all topics →</Link>
          </div>
          <TopicChips categories={topicsForChips} limit={16} showCount />
        </div>
      </section>

      {/* Entry points */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <EntryCards />
        </div>
      </section>

      {/* Request a review */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="promo">
            <div className="promo-inner">
              <span className="eyebrow">For readers &amp; brands</span>
              <h2>Want a specific product reviewed?</h2>
              <p>Submit a product and our editors will consider it for a hands-on guide. Every request is reviewed by a human — nothing is published automatically.</p>
              <div className="hero-actions">
                <Link href={CTA.href} className="btn btn-accent btn-lg">{CTA.label}</Link>
                <Link href="/categories" className="btn btn-ghost btn-lg">Explore topics</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
