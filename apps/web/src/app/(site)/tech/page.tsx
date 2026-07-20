import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { SECTION_TECH as SECTION } from '@/lib/sections';
import { MagazineSectionPage } from '@/components/site/MagazineSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SECTION.title} — ${SITE_NAME}`,
  description: SECTION.description,
  alternates: { canonical: `${SITE_URL}/tech` },
  openGraph: {
    title: `${SECTION.title} — ${SITE_NAME}`,
    description: SECTION.description,
    type: 'website',
    url: `${SITE_URL}/tech`,
  },
};

export default function TechPage() {
  return <MagazineSectionPage section={SECTION} />;
}
