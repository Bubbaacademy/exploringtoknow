import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { SECTION_FOOD_KITCHEN as SECTION } from '@/lib/sections';
import { MagazineSectionPage } from '@/components/site/MagazineSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SECTION.title} — ${SITE_NAME}`,
  description: SECTION.description,
  alternates: { canonical: `${SITE_URL}/food-kitchen` },
  openGraph: {
    title: `${SECTION.title} — ${SITE_NAME}`,
    description: SECTION.description,
    type: 'website',
    url: `${SITE_URL}/food-kitchen`,
  },
};

export default function FoodKitchenPage() {
  return <MagazineSectionPage section={SECTION} />;
}
