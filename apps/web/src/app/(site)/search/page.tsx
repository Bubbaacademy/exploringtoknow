import type { Metadata } from 'next';
import Link from 'next/link';
import { searchPublishedArticles, SITE_NAME, SITE_URL, SEARCH_MIN_QUERY, SEARCH_MAX_QUERY } from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';

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
  const { docs, total, query, capped } = await searchPublishedArticles(raw);
  const submitted = raw.trim().length > 0;
  const tooShort = submitted && query.length < SEARCH_MIN_QUERY;

  return (
    <section className="section">
      <div className="container">
        <div className="search-head">
          <span className="eyebrow">Find what you need</span>
          <h1>Search</h1>
          <form className="search-bar" role="search" action="/search" method="get">
            <label htmlFor="q" className="sr-only">Search articles</label>
            <input
              id="q"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search guides &amp; reviews…"
              maxLength={SEARCH_MAX_QUERY}
              autoComplete="off"
              autoFocus
            />
            <button type="submit" className="btn">Search</button>
          </form>
          {submitted && !tooShort ? (
            <p className="meta search-count">
              {total} result{total === 1 ? '' : 's'} for <strong>“{query}”</strong>
              {capped ? ' (query shortened)' : ''}
            </p>
          ) : null}
        </div>

        {!submitted ? (
          <div className="empty">
            <strong>Start typing to search</strong>
            Search across our published buying guides and product reviews by title, topic, or product.
          </div>
        ) : tooShort ? (
          <div className="empty">
            <strong>Please enter at least {SEARCH_MIN_QUERY} characters</strong>
            Try a product name, a topic, or a problem you’re trying to solve.
          </div>
        ) : (
          <ArticleGrid
            articles={docs}
            empty={
              <div className="empty">
                <strong>No results for “{query}”</strong>
                Try different keywords, or <Link href="/categories">browse all topics</Link>.
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}
