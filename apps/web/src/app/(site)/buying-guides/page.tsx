import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedArticlesByTypes, listActiveCategoriesWithCounts, SITE_NAME, SITE_URL } from '@/lib/public';
import { CTA } from '@/lib/nav';
import { ArticleGrid } from '@/components/site/ArticleGrid';
import { TopicChips } from '@/components/site/TopicChips';

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
        <ArticleGrid articles={articles} empty={<ListingEmpty kind="buying guides" />} />
      </div>
    </section>
  );
}

async function ListingEmpty({ kind }: { kind: string }) {
  const topics = (await listActiveCategoriesWithCounts()).filter((c) => c.articleCount > 0).slice(0, 10);
  return (
    <div className="empty-panel">
      <span className="eyebrow">Coming soon</span>
      <h2>Fresh {kind} are on the way</h2>
      <p>Our editors are researching and writing. Nothing is published until a human has reviewed it — explore published topics below in the meantime.</p>
      {topics.length ? (
        <>
          <div className="empty-panel-sub">Topics with published guides</div>
          <TopicChips categories={topics} showCount />
        </>
      ) : null}
      <div className="empty-panel-actions">
        <Link href="/explore" className="btn btn-ghost">Explore the magazine</Link>
        <Link href={CTA.href} className="btn btn-accent">{CTA.label}</Link>
      </div>
    </div>
  );
}
