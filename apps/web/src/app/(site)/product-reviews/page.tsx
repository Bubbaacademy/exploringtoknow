import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { SECTION_PRODUCT_REVIEWS as SECTION } from '@/lib/sections';
import { MagazineSectionPage } from '@/components/site/MagazineSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SECTION.title} — ${SITE_NAME}`,
  description: SECTION.description,
  alternates: { canonical: `${SITE_URL}/product-reviews` },
  openGraph: {
    title: `${SECTION.title} — ${SITE_NAME}`,
    description: SECTION.description,
    type: 'website',
    url: `${SITE_URL}/product-reviews`,
  },
};

export default function ProductReviewsPage() {
  return <MagazineSectionPage section={SECTION} />;
}
