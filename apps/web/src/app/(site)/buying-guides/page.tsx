import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticlesByTypes, SITE_NAME, SITE_URL } from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Buying Guides — ${SITE_NAME}`,
  description: 'In-depth, independent buying guides to help you choose well — researched and human-reviewed.',
  alternates: { canonical: `${SITE_URL}/buying-guides` },
};

export default async function BuyingGuidesPage() {
  const articles = await listPublishedArticlesByTypes(['buying_guide', 'best_list', 'comparison', 'how_to']);
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="section-title">
            <span className="eyebrow">Choose with confidence</span>
            <h1>Buying Guides</h1>
          </div>
          <Link href="/categories" className="section-link">Browse all topics →</Link>
        </div>
        <ArticleGrid
          articles={articles}
          empty={
            <div className="empty">
              <strong>No buying guides published yet</strong>
              New guides are in editorial review — <Link href="/categories">browse all topics</Link> in the meantime.
            </div>
          }
        />
      </div>
    </section>
  );
}
