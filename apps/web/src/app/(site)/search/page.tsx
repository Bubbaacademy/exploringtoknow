import type { Metadata } from 'next';
import Link from 'next/link';
import {
  searchPublishedArticles,
  listActiveCategoriesWithCounts,
  SITE_NAME,
  SITE_URL,
  SEARCH_MIN_QUERY,
  SEARCH_MAX_QUERY,
} from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';
import { TopicChips } from '@/components/site/TopicChips';

export const dynamic = 'force-dynamic';

// Search result pages are intentionally non-indexable (avoid unlimited indexable
// query URLs); links are still followed.
export const metadata: Metadata = {
  title: `Search — ${SITE_NAME}`,
  description: 'Search ExploringToKnow buying guides and product reviews.',
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/search` },
};

type Args = { searchParams: Promise<{ q?: string | string[] }> };

export default async function SearchPage({ searchParams }: Args) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] ?? '' : sp.q ?? '';
  const submitted = raw.trim().length > 0;
  const { docs, total, query, capped } = await searchPublishedArticles(raw);
  const tooShort = submitted && query.length < SEARCH_MIN_QUERY;
  // Only load topic suggestions when there is no active query (keeps queries cheap).
  const suggestions = submitted ? [] : (await listActiveCategoriesWithCounts()).filter((c) => c.articleCount > 0);

  return (
    <section className="section">
      <div className="container">
        <div className="search-hero">
          <span className="eyebrow">Find what you need</span>
          <h1>Search</h1>
          <p className="search-hero-sub">Search our published buying guides and reviews by title, topic, or product.</p>
          <form className="search-bar" role="search" action="/search" method="get">
            <label htmlFor="q" className="sr-only">Search articles</label>
            <span className="search-bar-ic" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            <input id="q" type="search" name="q" defaultValue={query} placeholder="Search guides &amp; reviews…" maxLength={SEARCH_MAX_QUERY} autoComplete="off" autoFocus />
            <button type="submit" className="btn">Search</button>
          </form>
          {submitted && !tooShort ? (
            <p className="meta search-count">
              {/* Results are page-limited by SEARCH_LIMIT. When more match than are
                  shown, say so honestly rather than implying every result is on the
                  page. `docs.length < total` is the only signal needed — no change
                  to the query, limit or fetch. */}
              {docs.length < total
                ? <>Showing first {docs.length} of {total} results for <strong>“{query}”</strong></>
                : <>{total} result{total === 1 ? '' : 's'} for <strong>“{query}”</strong></>}
              {capped ? ' (query shortened)' : ''}
            </p>
          ) : null}
        </div>

        {!submitted ? (
          <div className="empty-panel">
            <span className="eyebrow">Start here</span>
            <h2>What are you looking for?</h2>
            <p>Search published guides and reviews above, or jump into a popular topic.</p>
            {suggestions.length ? (
              <>
                <div className="empty-panel-sub">Popular topics</div>
                <TopicChips categories={suggestions} limit={10} showCount />
              </>
            ) : null}
          </div>
        ) : tooShort ? (
          <div className="empty-panel">
            <span className="eyebrow">Keep typing</span>
            <h2>Please enter at least {SEARCH_MIN_QUERY} characters</h2>
            <p>Try a product name, a topic, or a problem you’re trying to solve.</p>
          </div>
        ) : (
          <ArticleGrid
            articles={docs}
            empty={
              <div className="empty-panel">
                <span className="eyebrow">No matches</span>
                <h2>No results for “{query}”</h2>
                <p>Try different keywords, or browse our topics instead.</p>
                <div className="empty-panel-actions">
                  <Link href="/categories" className="btn btn-ghost">Browse all topics</Link>
                  <Link href="/explore-picks" className="btn btn-accent">Explore guides</Link>
                </div>
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}
