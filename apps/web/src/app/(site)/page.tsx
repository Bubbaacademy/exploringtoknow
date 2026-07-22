import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listPublishedArticles,
  listActiveCategoriesWithCounts,
  listMostReadArticles,
  listTrendingArticles,
  listPublishedArticlesByTypes,
  countPublishedByTypes,
  countPublishedArticles,
  mediaUrl,
  SITE_NAME,
  SITE_URL,
  type Doc,
} from '@/lib/public';
import {
  MAGAZINE_SECTIONS,
  VERTICAL_SECTIONS,
  SECTION_BUYING_GUIDES,
  SECTION_PRODUCT_REVIEWS,
  type MagazineSection,
} from '@/lib/sections';
import { ArticleCard } from '@/components/site/ArticleCard';
import { TopicChips } from '@/components/site/TopicChips';
import { NewsletterSignup } from '@/components/site/NewsletterSignup';

export const dynamic = 'force-dynamic';

const HOME_DESCRIPTION =
  'An independent magazine of practical buying guides and honest product reviews — researched by hand, AI-assisted in the drafting, and human-reviewed before anything is published.';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Independent buying guides & product reviews`,
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Independent buying guides & product reviews`,
    description: HOME_DESCRIPTION,
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  // Summary card only: the front page has no single representative image, and
  // substituting an unrelated article hero would misrepresent the page.
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} — Independent buying guides & product reviews`,
    description: HOME_DESCRIPTION,
  },
};

const STEPS = [
  { n: '1', t: 'Researched, not scraped', d: 'Every guide starts from real product research and the questions readers actually ask — never spun from thin air.' },
  { n: '2', t: 'Drafted with AI assistance', d: 'We use AI to draft faster and stay structured, then hold every claim to a human standard.' },
  { n: '3', t: 'Human editorial review', d: 'Nothing is published until an editor has reviewed it. No auto-publishing, no sponsored rankings.' },
];

// Curated magazine sections come from the single shared section map
// (`lib/sections.ts`), which also backs the real section pages — so the homepage
// and the section pages can never disagree about what belongs where. Unknown/new
// categories are never dropped: they still surface via the Topics menu and the
// "Browse by topic" chips below.

const catOf = (a: Doc | undefined | null): Doc | null =>
  a && typeof a.category === 'object' ? (a.category as Doc) : null;

const fmtDate = (v: unknown): string | null =>
  v ? new Date(String(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

// Compact editorial pick card for the "Explore Picks" strip.
function PickCard({ article }: { article: Doc }) {
  const cat = catOf(article);
  const hero = mediaUrl(article.images?.hero);
  return (
    <Link href={`/${article.slug}`} className="pick-card" aria-label={article.title as string}>
      <span className="pick-media">
        {hero ? <img src={hero} alt={(article.images?.heroAlt as string) || (article.title as string)} loading="lazy" /> : <span>ExploringToKnow</span>}
      </span>
      <span className="pick-body">
        {cat ? <span className="cat">{cat.name as string}</span> : null}
        <h3>{article.title as string}</h3>
      </span>
    </Link>
  );
}

/**
 * Front-page directory of the eight magazine sections (Phase 2L).
 *
 * This REPLACES the old per-section placeholder banners. The previous homepage
 * rendered a dashed "guides are on the way" panel for every empty section, which
 * on today's thin content meant six consecutive placeholders — the page read as
 * unfinished rather than sparse. One deliberate 8-card directory shows the whole
 * magazine at a glance instead.
 *
 * The meta line is a REAL published count in every case; sections without content
 * say "In progress" once, inside a polished card, rather than shouting "coming
 * soon" across the page. Nothing here fabricates an article or a number.
 */
function SectionDirectoryCard({ section, count }: { section: MagazineSection; count: number }) {
  const has = count > 0;
  return (
    <Link href={`/${section.slug}`} className={`secdir-card${has ? ' has-content' : ''}`}>
      <span className="eyebrow">{section.eyebrow}</span>
      <h3>{section.title}</h3>
      <p>{section.description}</p>
      <span className="secdir-meta">
        {has ? `${count} published ${count === 1 ? 'guide' : 'guides'}` : 'In progress'}
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const [pool, cats, featuredArr, guides, guideCount, reviewCount, totalPublished] = await Promise.all([
    listPublishedArticles({ limit: 40 }),
    listActiveCategoriesWithCounts(),
    listPublishedArticles({ limit: 1, featured: true }),
    listPublishedArticlesByTypes(['buying_guide', 'best_list', 'comparison', 'how_to'], { limit: 10 }),
    countPublishedByTypes(SECTION_BUYING_GUIDES.types ?? []),
    countPublishedByTypes(SECTION_PRODUCT_REVIEWS.types ?? []),
    countPublishedArticles(),
  ]);
  // Real "most read" from first-party analytics when data exists; otherwise an
  // honest deterministic ranking (featured + recency) — never fabricated counts.
  const mostRead = await listMostReadArticles(30, 8);
  const measured = mostRead.length > 0;
  const trendingAll = measured ? mostRead : await listTrendingArticles(8);

  const usedIds = new Set<string | number>();

  const cover = (featuredArr[0] as Doc | undefined) || (pool[0] as Doc | undefined);
  const coverCat = catOf(cover);
  const coverDate = fmtDate(cover?.editorialPublishedAt);
  const coverIsFeatured = cover?.featured === true;
  if (cover) usedIds.add(cover.id);

  // Worth reading now. The heading states which ranking is actually in use —
  // measured reads vs. latest — so the page never implies analytics it does not have.
  const trending = trendingAll.filter((a) => !usedIds.has(a.id)).slice(0, 6);
  trending.forEach((a) => usedIds.add(a.id));

  // Explore Picks — editorial picks strip. Prefer guide/best-list content; fall
  // back to the latest pool so the strip is never empty when content exists.
  const picksSource = (guides.length ? guides : pool).filter((a) => !usedIds.has(a.id));
  const picks = picksSource.slice(0, 5);
  picks.forEach((a) => usedIds.add(a.id));

  // Bucket remaining REAL articles into the magazine category sections.
  const bucket: Record<string, Doc[]> = {};
  for (const a of pool) {
    if (usedIds.has(a.id)) continue;
    const slug = catOf(a)?.slug as string | undefined;
    if (!slug) continue;
    const sec = VERTICAL_SECTIONS.find((s) => (s.categorySlugs ?? []).includes(slug));
    if (!sec) continue;
    const list = (bucket[sec.title] ??= []);
    if (list.length < 3) { list.push(a); usedIds.add(a.id); }
  }

  // Only verticals that genuinely have articles get their own preview row. Empty
  // ones are represented honestly in the section directory instead of producing a
  // placeholder banner apiece.
  const previewSections = VERTICAL_SECTIONS
    .map((s) => ({ section: s, items: bucket[s.title] ?? [] }))
    .filter((r) => r.items.length > 0)
    .slice(0, 3);

  // Buying Guides magazine block (type-based, deduped).
  const buyingGuides = guides.filter((a) => !usedIds.has(a.id)).slice(0, 3);

  // Real published count per section, from real records only:
  //  - category sections sum the published counts of their own active categories
  //  - the two listing sections are counted by their real `type` values
  //  - Explore Picks is curated across the whole magazine, so it is the total
  const countBySlug = new Map(cats.map((c) => [String(c.slug), c.articleCount]));
  const sectionCount = (s: MagazineSection): number => {
    if (s.kind === 'category') return (s.categorySlugs ?? []).reduce((n, slug) => n + (countBySlug.get(slug) ?? 0), 0);
    if (s.slug === SECTION_BUYING_GUIDES.slug) return guideCount;
    if (s.slug === SECTION_PRODUCT_REVIEWS.slug) return reviewCount;
    return totalPublished;
  };
  // Sections with content first; `sort` is stable, so the editorial order declared
  // in MAGAZINE_SECTIONS is preserved inside each group. All eight always render.
  const directory = MAGAZINE_SECTIONS
    .map((s) => ({ section: s, count: sectionCount(s) }))
    .sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0));
  const liveSections = directory.filter((d) => d.count > 0).length;

  // The directory is the one block that ALWAYS renders, so it cannot assume a
  // feed above it. With zero published articles every preceding block is absent
  // and a hard-coded `paddingTop: 0` would collapse it against the hero.
  const hasFeedAbove =
    Boolean(cover) || trending.length > 0 || picks.length >= 2
    || previewSections.length > 0 || buyingGuides.length > 0;

  // Topic chips: every active category still appears on /categories, but the front
  // page leads with the topics that actually have published guides so a reader's
  // first click lands on real content. Ordering only — counts come from the records.
  const chipOrder = [...cats].sort((a, b) => (b.articleCount > 0 ? 1 : 0) - (a.articleCount > 0 ? 1 : 0));

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

      {/* Editorial hero — reader paths only. Every href is a real magazine route. */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">Independent buying guides &amp; reviews</span>
            <h1>Explore smarter. Buy better. <em>Know before you choose.</em></h1>
            <p className="lede">
              ExploringToKnow is an independent magazine for people who want to understand what they are
              buying. We research the options, explain what actually matters, and publish nothing until a
              human editor has reviewed it.
            </p>
            <div className="hero-actions">
              <Link href="/buying-guides" className="btn btn-lg">Explore buying guides</Link>
              <Link href="/product-reviews" className="btn btn-ghost btn-lg">Read product reviews</Link>
              <Link href="/categories" className="hero-link">Browse all topics →</Link>
            </div>
            <div className="hero-trust">
              <span>Manually researched</span>
              <span>Human-reviewed</span>
              <span>No sponsored rankings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cover story — always a REAL published article, never a fabricated one. */}
      {cover ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Cover story</span>
                <h2>{coverIsFeatured ? "The editors' pick" : 'The latest from the desk'}</h2>
              </div>
            </div>
            <Link href={`/${cover.slug}`} className="cover" aria-label={cover.title as string}>
              <div className="cover-media">
                {mediaUrl(cover.images?.hero)
                  ? (
                    <img
                      src={mediaUrl(cover.images?.hero)!}
                      alt={(cover.images?.heroAlt as string) || (cover.title as string)}
                      fetchPriority="high"
                      decoding="async"
                    />
                  )
                  : <span aria-hidden="true">ExploringToKnow</span>}
              </div>
              <div className="cover-body">
                {coverCat ? <span className="cat">{coverCat.name as string}</span> : null}
                <h3>{cover.title as string}</h3>
                {cover.excerpt ? <p>{String(cover.excerpt).slice(0, 220)}</p> : null}
                {coverDate ? <span className="cover-meta">Published {coverDate}</span> : null}
                <span className="cover-cta">Read the guide →</span>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Worth reading now — heading reflects the ranking actually used. */}
      {trending.length ? (
        <section className="section" id="trending" style={{ paddingTop: cover ? 0 : undefined }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">{measured ? 'Most read' : 'Fresh off the desk'}</span>
                <h2>{measured ? 'What readers are reading' : 'Latest guides & reviews'}</h2>
              </div>
              <Link href="/explore-picks" className="section-link">Explore more →</Link>
            </div>
            <div className="grid">{trending.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* Explore Picks — a dedicated strip only when there are enough picks to
          read as a strip; a single card is better served by a grid above. */}
      {picks.length >= 2 ? (
        <section className="section" style={{ paddingTop: trending.length ? 0 : undefined }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Editorial picks</span>
                <h2>Explore Picks</h2>
              </div>
              <Link href="/explore-picks" className="section-link">See all picks →</Link>
            </div>
            <div className="picks-strip">
              {picks.map((a) => <PickCard key={String(a.id)} article={a} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* Section previews — ONLY for sections that actually have articles. */}
      {previewSections.map(({ section, items }) => (
        <section className="section" key={section.slug} style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">{section.eyebrow}</span>
                <h2>{section.title}</h2>
              </div>
              <Link href={`/${section.slug}`} className="section-link">View all →</Link>
            </div>
            <div className="grid">{items.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ))}

      {/* Buying Guides — real guides only; the directory below covers it when thin. */}
      {buyingGuides.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Choose with confidence</span>
                <h2>Buying Guides</h2>
              </div>
              <Link href="/buying-guides" className="section-link">All buying guides →</Link>
            </div>
            <div className="grid">{buyingGuides.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* The magazine at a glance — all eight sections, with REAL counts. */}
      <section className="section" style={{ paddingTop: hasFeedAbove ? 0 : undefined }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Inside the magazine</span>
              <h2>Explore every section</h2>
            </div>
            <Link href="/categories" className="section-link">Browse all topics →</Link>
          </div>
          <div className="secdir">
            {directory.map(({ section, count }) => (
              <SectionDirectoryCard key={section.slug} section={section} count={count} />
            ))}
          </div>
          {liveSections < MAGAZINE_SECTIONS.length ? (
            <p className="secdir-note">
              Sections marked <em>In progress</em> are being researched and written now. We would rather
              leave a section thin than fill it with anything an editor has not reviewed.
            </p>
          ) : null}
        </div>
      </section>

      {/* Browse by topic — real active categories with real counts. */}
      {chipOrder.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Find your topic</span>
                <h2>Browse by topic</h2>
              </div>
              <Link href="/categories" className="section-link">All topics →</Link>
            </div>
            <TopicChips categories={chipOrder} limit={14} showCount />
          </div>
        </section>
      ) : null}

      {/* How every guide is made */}
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
