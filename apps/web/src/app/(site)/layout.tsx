import type { ReactNode } from 'react';
import './site.css';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

// Public content website shell (header + footer + global editorial styling).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
