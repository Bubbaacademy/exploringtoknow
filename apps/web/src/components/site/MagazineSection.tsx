import Link from 'next/link';
import {
  listPublishedArticlesBySectionCategories,
  listPublishedArticlesByTypes,
  listActiveCategoriesWithCounts,
  mediaUrl,
  type Doc,
} from '@/lib/public';
import type { MagazineSection as Section } from '@/lib/sections';
import { ArticleCard } from './ArticleCard';
import { TopicChips } from './TopicChips';

/**
 * Shared editorial section page (Phase 2E) for both category-backed verticals and
 * type-backed listings. Structure is magazine-first: section hero → description →
 * feature card → latest grid → topic chips → honest empty state.
 *
 * Content is ALWAYS real published data. When a section is thin, it degrades
 * gracefully — a feature card without a grid, or a "more guides coming soon"
 * panel — and never fabricates articles or counts. Reuses existing site CSS
 * classes only; no new stylesheet is introduced.
 */

const catOf = (a: Doc | undefined | null): Doc | null =>
  a && typeof a.category === 'object' ? (a.category as Doc) : null;

/** Feature card for the section's lead article. Mirrors the homepage cover treatment. */
function SectionFeature({ article, label }: { article: Doc; label: string }) {
  const cat = catOf(article);
  const hero = mediaUrl(article.images?.hero);
  return (
    <Link href={`/${article.slug}`} className="cover" aria-label={article.title as string}>
      <div className="cover-media">
        {hero
          ? <img src={hero} alt={(article.images?.heroAlt as string) || (article.title as string)} />
          : <span>ExploringToKnow</span>}
      </div>
      <div className="cover-body">
        <span className="eyebrow">{label}</span>
        {cat ? <span className="cat">{cat.name as string}</span> : null}
        <h2>{article.title as string}</h2>
        {article.excerpt ? <p>{String(article.excerpt).slice(0, 220)}</p> : null}
        <span className="cover-cta">Read the guide →</span>
      </div>
    </Link>
  );
}

/**
 * Honest empty state. Never invents articles — it explains the editorial process
 * and routes the reader to topics that genuinely have published content.
 */
async function SectionEmpty({ section }: { section: Section }) {
  const withContent = (await listActiveCategoriesWithCounts()).filter((c) => c.articleCount > 0).slice(0, 10);
  return (
    <div className="empty-panel">
      <span className="eyebrow">Coming soon</span>
      <h2>More {section.title} guides are coming soon</h2>
      <p>
        Our editors are researching and writing this section now. Nothing is published until a human has
        reviewed it — so this space stays empty rather than filled with anything we have not checked.
      </p>
      {withContent.length ? (
        <>
          <div className="empty-panel-sub">Topics with published guides</div>
          <TopicChips categories={withContent} showCount />
        </>
      ) : null}
      <div className="empty-panel-actions">
        <Link href="/explore-picks" className="btn btn-ghost">Explore the magazine</Link>
        <Link href="/categories" className="btn btn-accent">Browse all topics</Link>
      </div>
    </div>
  );
}

export async function MagazineSectionPage({ section }: { section: Section }) {
  // Resolve the section's real content through existing published-gated helpers.
  const { articles, sectionCategories } = section.kind === 'category'
    ? await listPublishedArticlesBySectionCategories(section.categorySlugs ?? [], { limit: 48 })
        .then((r) => ({ articles: r.articles, sectionCategories: r.categories }))
    : await listPublishedArticlesByTypes(section.types ?? [], { limit: 48 })
        .then((articles) => ({ articles, sectionCategories: [] as Array<Doc & { articleCount: number }> }));

  // Lead with an editorially featured article when the section has one.
  const feature = articles.find((a) => a.featured === true) ?? articles[0] ?? null;
  const grid = feature ? articles.filter((a) => a.id !== feature.id) : articles;

  // Chips: the section's own categories when they exist, else site-wide topics
  // that actually have content. Only categories with published articles are shown
  // so a chip never leads to an empty page.
  const chips = sectionCategories.length
    ? sectionCategories.filter((c) => c.articleCount > 0)
    : (await listActiveCategoriesWithCounts()).filter((c) => c.articleCount > 0).slice(0, 12);

  return (
    <>
      {/* Section hero + description. The count is the REAL number of published
          articles in this section and is shown only when there is at least one —
          a "0 guides" line would be noise, and the empty state already says it. */}
      <section className="section">
        <div className="container">
          <div className="hub-head">
            <span className="eyebrow">{section.eyebrow}</span>
            <h1>{section.title}</h1>
            <p className="hub-head-desc">{section.description}</p>
            {articles.length ? (
              <p className="hub-head-meta">
                {articles.length} published {articles.length === 1 ? 'guide' : 'guides'}
                {chips.length ? <> · {chips.length} {chips.length === 1 ? 'topic' : 'topics'}</> : null}
                {' '}· Independently researched, human-reviewed
              </p>
            ) : null}
          </div>

          {feature
            ? <SectionFeature article={feature} label={feature.featured === true ? 'Featured' : 'Latest in this section'} />
            : <SectionEmpty section={section} />}
        </div>
      </section>

      {/* Latest in this section */}
      {grid.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Fresh off the desk</span>
                <h2>Latest in {section.title}</h2>
              </div>
              <Link href="/categories" className="section-link">Browse all topics →</Link>
            </div>
            <div className="grid">{grid.map((a) => <ArticleCard key={String(a.id)} article={a} />)}</div>
          </div>
        </section>
      ) : null}

      {/* Topic chips for this section */}
      {chips.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Find your topic</span>
                <h2>{sectionCategories.length ? `Topics in ${section.title}` : 'Browse by topic'}</h2>
              </div>
              <Link href="/categories" className="section-link">View all topics →</Link>
            </div>
            <TopicChips categories={chips} limit={16} showCount />
          </div>
        </section>
      ) : null}
    </>
  );
}
