import type { Metadata } from 'next';
import { listActiveCategories, SITE_NAME, SITE_URL } from '@/lib/public';
import { RequestProductForm } from '@/components/site/RequestProductForm';

export const dynamic = 'force-dynamic';

/**
 * Unlinked, noindexed submission route (Phase 2F). The page and its intake path
 * are unchanged and fully functional at the direct URL, but ExploringToKnow's
 * public magazine surface no longer promotes or links to it, and it is excluded
 * from the sitemap — the public site reads as an independent publication, not a
 * submission funnel.
 */
export const metadata: Metadata = {
  title: `Request a product review — ${SITE_NAME}`,
  description: 'Submit a product for editorial review. Every request is reviewed by an editor before any article is created or published.',
  alternates: { canonical: `${SITE_URL}/request-product` },
  robots: { index: false, follow: false },
};

export default async function RequestProductPage() {
  const categories = await listActiveCategories();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="request-head">
          <span className="eyebrow">Reader requests</span>
          <h1>Request a Review</h1>
          <p className="request-lede">
            Tell us about a product you&apos;d like reviewed. An editor reads every submission before anything is created or
            published — nothing is automated, and nothing goes live without manual approval.
          </p>
          <ul className="request-trust">
            <li>Human editorial review</li>
            <li>No auto-publishing</li>
            <li>Your images, used with permission</li>
          </ul>
        </div>
      </div>
      <RequestProductForm
        categories={categories
          .map((c) => ({ id: c.id, name: c.name as string, slug: c.slug as string }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </section>
  );
}
