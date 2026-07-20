import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { SECTION_BEAUTY_STYLE as SECTION } from '@/lib/sections';
import { MagazineSectionPage } from '@/components/site/MagazineSection';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SECTION.title} — ${SITE_NAME}`,
  description: SECTION.description,
  alternates: { canonical: `${SITE_URL}/beauty-style` },
  openGraph: {
    title: `${SECTION.title} — ${SITE_NAME}`,
    description: SECTION.description,
    type: 'website',
    url: `${SITE_URL}/beauty-style`,
  },
};

export default function BeautyStylePage() {
  return <MagazineSectionPage section={SECTION} />;
}
