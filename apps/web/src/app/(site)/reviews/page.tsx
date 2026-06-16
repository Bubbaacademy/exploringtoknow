import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticlesByTypes, listActiveCategoriesWithCounts, SITE_NAME, SITE_URL } from '@/lib/public';
import { CTA } from '@/lib/nav';
import { ArticleGrid } from '@/components/site/ArticleGrid';
import { TopicChips } from '@/components/site/TopicChips';

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
        <ArticleGrid articles={articles} empty={<ReviewsEmpty />} />
      </div>
    </section>
  );
}

async function ReviewsEmpty() {
  const topics = (await listActiveCategoriesWithCounts()).filter((c) => c.articleCount > 0).slice(0, 10);
  return (
    <div className="empty-panel">
      <span className="eyebrow">Coming soon</span>
      <h2>Fresh reviews are on the way</h2>
      <p>Our editors test and write before anything goes live — no sponsored rankings, no auto-publishing. Explore published topics below in the meantime.</p>
      {topics.length ? (
        <>
          <div className="empty-panel-sub">Topics with published guides</div>
          <TopicChips categories={topics} showCount />
        </>
      ) : null}
      <div className="empty-panel-actions">
        <Link href="/buying-guides" className="btn btn-ghost">Read our buying guides</Link>
        <Link href={CTA.href} className="btn btn-accent">{CTA.label}</Link>
      </div>
    </div>
  );
}
