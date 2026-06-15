import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticlesByTypes, SITE_NAME, SITE_URL } from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Product Reviews — ${SITE_NAME}`,
  description: 'Hands-on, independent product reviews — manually researched and human-reviewed before publishing.',
  alternates: { canonical: `${SITE_URL}/reviews` },
};

export default async function ReviewsPage() {
  const articles = await listPublishedArticlesByTypes(['review', 'comparison']);
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="section-title">
            <span className="eyebrow">Tested &amp; considered</span>
            <h1>Product Reviews</h1>
          </div>
          <Link href="/categories" className="section-link">Browse all topics →</Link>
        </div>
        <ArticleGrid
          articles={articles}
          empty={
            <div className="empty">
              <strong>No reviews published yet</strong>
              Reviews are in editorial review — <Link href="/buying-guides">read our buying guides</Link> or <Link href="/categories">browse topics</Link>.
            </div>
          }
        />
      </div>
    </section>
  );
}
