import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticles, SITE_NAME, SITE_URL, type Doc } from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Explore Picks — ${SITE_NAME}`,
  description: 'Editor-selected guides and reviews worth exploring — featured first, then the latest.',
  alternates: { canonical: `${SITE_URL}/explore` },
};

export default async function ExplorePage() {
  // Editorial picks: featured published articles first, then fill with the latest.
  const [featured, latest] = await Promise.all([
    listPublishedArticles({ featured: true, limit: 12 }),
    listPublishedArticles({ limit: 24 }),
  ]);
  const seen = new Set<unknown>(featured.map((a) => a.id));
  const picks: Doc[] = [...featured, ...latest.filter((a) => !seen.has(a.id))].slice(0, 24);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="section-title">
            <span className="eyebrow">Editor-selected</span>
            <h1>Explore Picks</h1>
          </div>
          <Link href="/categories" className="section-link">Browse all topics →</Link>
        </div>
        <ArticleGrid
          articles={picks}
          empty={
            <div className="empty">
              <strong>Nothing to explore yet</strong>
              Published guides will appear here — <Link href="/categories">browse all topics</Link> to get started.
            </div>
          }
        />
      </div>
    </section>
  );
}
