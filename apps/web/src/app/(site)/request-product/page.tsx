import type { Metadata } from 'next';
import { listActiveCategories, SITE_NAME, SITE_URL } from '@/lib/public';
import { RequestProductForm } from '@/components/site/RequestProductForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Request a product review — ${SITE_NAME}`,
  description: 'Submit a product for editorial review. Every request is reviewed by an editor before any article is created or published.',
  alternates: { canonical: `${SITE_URL}/request-product` },
};

export default async function RequestProductPage() {
  const categories = await listActiveCategories();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Request a product review</h1>
        <p className="meta">
          Tell us about a product you&apos;d like reviewed. An editor reviews every submission before anything is created or
          published — nothing is automated and nothing goes live without manual approval.
        </p>
      </div>
      <RequestProductForm
        categories={categories
          .map((c) => ({ id: c.id, name: c.name as string, slug: c.slug as string }))
          .sort((a, b) => a.name.localeCompare(b.name))}
      />
    </section>
  );
}
