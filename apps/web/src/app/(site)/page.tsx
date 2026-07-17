import type { Metadata } from 'next';
import Link from 'next/link';
import {
  listPublishedArticles,
  listActiveCategoriesWithCounts,
  listMostReadArticles,
  listTrendingArticles,
  listPublishedArticlesByTypes,
  mediaUrl,
  SITE_NAME,
  SITE_URL,
  type Doc,
} from '@/lib/public';
import { ArticleCard } from '@/components/site/ArticleCard';
import { NewsletterSignup } from '@/components/site/NewsletterSignup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Independent buying guides & product reviews`,
  description: 'An independent magazine of buying guides and product reviews — manually researched, AI-assisted in the drafting, and human-reviewed before anything goes live.',
  alternates: { canonical: SITE_URL },
  openGraph: { title: SITE_NAME, description: 'Independent buying guides & product reviews.', type: 'website', url: SITE_URL },
};

const STEPS = [
  { n: '1', t: 'Researched, not scraped', d: 'Every guide starts from real product research and the questions readers actually ask — never spun from thin air.' },
  { n: '2', t: 'Drafted with AI assistance', d: 'We use AI to draft faster and stay structured, then hold every claim to a human standard.' },
  { n: '3', t: 'Human editorial review', d: 'Nothing is published until an editor has reviewed it. No auto-publishing, no sponsored rankings.' },
];

// Curated magazine sections → real seeded category slugs (presentation map only).
// Unknown/new categories are never dropped — they still surface via the Topics
// menu and the "Browse by category" chips below.
const MAGAZINE_SECTIONS: { title: string; slugs: string[] }[] = [
  { title: 'Home & Living', slugs: ['home-kitchen', 'appliances', 'tools-home-improvement', 'outdoors-garden-patio', 'industrial-professional'] },
  { title: 'Beauty & Style', slugs: ['beauty-personal-care', 'clothing-shoes-accessories', 'jewelry-watches', 'sleep-wellness'] },
  { title: 'Tech & Everyday Gear', slugs: ['tech-electronics', 'office-school-business', 'automotive', 'books-media-entertainment'] },
  { title: 'Family & Pets', slugs: ['baby-kids', 'pet-supplies', 'toys-games', 'health-fitness'] },
  { title: 'Food & Kitchen', slugs: ['food-grocery'] },
];

const catOf = (a: Doc | undefined | null): Doc | null =>
  a && typeof a.category === 'object' ? (a.category as Doc) : null;

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

export default async function HomePage() {
  const [pool, cats, featuredArr, guides] = await Promise.all([
    listPublishedArticles({ limit: 40 }),
    listActiveCategoriesWithCounts(),
    listPublishedArticles({ limit: 1, featured: true }),
    listPublishedArticlesByTypes(['buying_guide', 'best_list', 'comparison', 'how_to'], { limit: 10 }),
  ]);
  // Real "most read" from first-party analytics when data exists; otherwise an
  // honest deterministic ranking (featured + recency) — never fabricated counts.
  const mostRead = await listMostReadArticles(30, 8);
  const trendingAll = mostRead.length ? mostRead : await listTrendingArticles(8);

  const usedIds = new Set<string | number>();

  const cover = (featuredArr[0] as Doc | undefined) || (pool[0] as Doc | undefined);
  const coverCat = catOf(cover);
  if (cover) usedIds.add(cover.id);

  // Trending / worth reading now (deterministic — never fake view counts).
  const trending = trendingAll.filter((a) => !usedIds.has(a.id)).slice(0, 6);
  trending.forEach((a) => usedIds.add(a.id));

  // Explore Picks — editorial picks strip. Prefer guide/best-list content; fall
  // back to the latest pool so the strip is never empty when content exists.
  const picksSource = (guides.length ? guides : pool).filter((a) => !usedIds.has(a.id));
  const picks = picksSource.slice(0, 5);
  picks.forEach((a) => usedIds.add(a.id));

  // Bucket remaining REAL articles into the magazine category sections.
  const catSlugs = new Set(cats.map((c) => c.slug as string));
  const bucket: Record<string, Doc[]> = {};
  for (const a of pool) {
    if (usedIds.has(a.id)) continue;
    const slug = catOf(a)?.slug as string | undefined;
    if (!slug) continue;
    const sec = MAGAZINE_SECTIONS.find((s) => s.slugs.includes(slug));
    if (!sec) continue;
    const list = (bucket[sec.title] ??= []);
    if (list.length < 3) { list.push(a); usedIds.add(a.id); }
  }
  const sectionLink = (slugs: string[]): string => {
    const slug = slugs.find((x) => catSlugs.has(x));
    return slug ? `/category/${slug}` : '/categories';
  };

  // Buying Guides magazine block (type-based, deduped).
  const buyingGuides = guides.filter((a) => !usedIds.has(a.id)).slice(0, 3);

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

      {/* Editorial hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">Independent buying guides &amp; reviews</span>
            <h1>Explore smarter. Buy better. <em>Know before you choose.</em></h1>
            <p className="lede">
              An independent magazine of practical buying guides and honest product reviews —
              manually researched, AI-assisted in the drafting, and human-reviewed before anything goes live.
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
                <span className="eyebrow">Cover story</span>
                <h2>The story worth your time</h2>
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

      {/* Worth reading now (trending) */}
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

      {/* Explore Picks — editorial picks strip */}
      {picks.length ? (
        <section className="section" style={{ paddingTop: trending.length ? 0 : undefined }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Editorial picks</span>
                <h2>Explore Picks</h2>
              </div>
              <Link href="/explore" className="section-link">See all picks →</Link>
            </div>
            <div className="picks-strip">
              {picks.map((a) => <PickCard key={String(a.id)} article={a} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* Magazine category sections */}
      {MAGAZINE_SECTIONS.map((s, i) => {
        const items = bucket[s.title] ?? [];
        return (
          <section className="section" key={s.title} style={{ paddingTop: i === 0 ? undefined : 0 }}>
            <div className="container">
              <div className="section-head">
                <div className="section-title">
                  <span className="eyebrow">Magazine</span>
                  <h2>{s.title}</h2>
                </div>
                <Link href={sectionLink(s.slugs)} className="section-link">View all →</Link>
              </div>
              {items.length ? (
                <div className="grid">{items.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
              ) : (
                <div className="mag-ph">
                  <span>Fresh {s.title} guides are on the way — browse related topics in the meantime.</span>
                  <Link href={sectionLink(s.slugs)}>Browse topics →</Link>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Buying Guides */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Choose with confidence</span>
              <h2>Buying Guides</h2>
            </div>
            <Link href="/buying-guides" className="section-link">All buying guides →</Link>
          </div>
          {buyingGuides.length ? (
            <div className="grid">{buyingGuides.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          ) : (
            <div className="mag-ph">
              <span>In-depth buying guides that compare options and explain what actually matters.</span>
              <Link href="/buying-guides">Explore guides →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Browse by category */}
      {cats.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Find your topic</span>
                <h2>Browse by category</h2>
              </div>
              <Link href="/categories" className="section-link">All topics →</Link>
            </div>
            <div className="cat-chips">
              {cats.map((c) => (
                <Link key={String(c.id)} href={`/category/${c.slug}`} className="cat-chip">
                  <span className="dot" aria-hidden="true">{String(c.name).trim().charAt(0).toUpperCase()}</span>
                  {c.name as string}
                </Link>
              ))}
            </div>
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
