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
import { SECTION_EXPLORE_PICKS as SECTION, VERTICAL_SECTIONS } from '@/lib/sections';
import { ArticleCard } from '@/components/site/ArticleCard';
import { TopicChips } from '@/components/site/TopicChips';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SECTION.title} — ${SITE_NAME}`,
  description: SECTION.description,
  alternates: { canonical: `${SITE_URL}/explore-picks` },
  openGraph: {
    title: `${SECTION.title} — ${SITE_NAME}`,
    description: SECTION.description,
    type: 'website',
    url: `${SITE_URL}/explore-picks`,
  },
};

/** Entry points into the magazine's editorial verticals + listing sections. */
function SectionEntryCards() {
  return (
    <div className="entry-cards">
      <Link href="/buying-guides" className="entry-card">
        <span className="eyebrow">Choose with confidence</span>
        <h3>Buying Guides</h3>
        <p>In-depth guides that compare options and explain what actually matters.</p>
        <span className="entry-card-cta">Explore guides →</span>
      </Link>
      <Link href="/product-reviews" className="entry-card">
        <span className="eyebrow">Considered, not sponsored</span>
        <h3>Product Reviews</h3>
        <p>Honest, independent reviews — no sponsored rankings, no hype.</p>
        <span className="entry-card-cta">Read reviews →</span>
      </Link>
    </div>
  );
}

export default async function ExplorePicksPage() {
  const [featured, latest, cats] = await Promise.all([
    listPublishedArticles({ featured: true, limit: 1 }),
    listPublishedArticles({ limit: 13 }),
    listActiveCategoriesWithCounts(),
  ]);
  const cover = (featured[0] as Doc | undefined) || (latest[0] as Doc | undefined);
  const coverCat = cover && typeof cover.category === 'object' ? (cover.category as Doc) : null;
  const grid = cover ? latest.filter((a) => a.id !== cover.id).slice(0, 12) : latest;
  const topicsForChips = [...cats].sort((a, b) => b.articleCount - a.articleCount);
  const featuredCats = cats.filter((c) => c.featured);

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="hub-head">
            <span className="eyebrow">{SECTION.eyebrow}</span>
            <h1>{SECTION.title}</h1>
            <p className="hub-head-desc">{SECTION.description}</p>
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
                <h2>{cover.title as string}</h2>
                {cover.excerpt ? <p>{String(cover.excerpt).slice(0, 220)}</p> : null}
                <span className="cover-cta">Read the guide →</span>
              </div>
            </Link>
          ) : (
            <div className="empty-panel">
              <span className="eyebrow">Coming soon</span>
              <h2>Fresh picks are on the way</h2>
              <p>Nothing is published until a human editor has reviewed it. Browse the magazine sections below in the meantime.</p>
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

      {/* Magazine sections — always available, never depends on article volume */}
      <section className="section" style={{ paddingTop: grid.length ? 0 : undefined }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Read by section</span>
              <h2>Explore the magazine</h2>
            </div>
          </div>
          <div className="cat-chips">
            {VERTICAL_SECTIONS.map((s) => (
              <Link key={s.slug} href={`/${s.slug}`} className="cat-chip">
                <span className="dot" aria-hidden="true">{s.title.trim().charAt(0)}</span>
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured topics (editorial curation — only when categories are flagged featured) */}
      {featuredCats.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Editor-curated</span>
                <h2>Featured topics</h2>
              </div>
            </div>
            <TopicChips categories={featuredCats} showCount />
          </div>
        </section>
      ) : null}

      {/* Browse by topic */}
      <section className="section" style={{ paddingTop: 0 }}>
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
          <SectionEntryCards />
        </div>
      </section>
    </>
  );
}
