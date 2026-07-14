import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import '../(site)/site.css';
import './bubbaaffiliate.css';
import { gatewayBase, gwHref } from '@/lib/gateway';

/**
 * BubbaAffiliate public gateway shell (Phase 1B / 2A; host-aware links in Phase 1C).
 *
 * A SEPARATE top-level segment (not under the ExploringToKnow (site) chrome) so the
 * gateway reads as its own commercial brand. Links are host-aware: clean ('/sellers')
 * on the bubbaaffiliate.com apex, prefixed ('/bubbaaffiliate/sellers') elsewhere.
 * Domain routing is enforced in middleware.ts.
 *
 * NOTE: robots = noindex for now. Flip to index when going fully public on the
 * bubbaaffiliate.com apex.
 */
export const metadata: Metadata = {
  title: 'BubbaAffiliate — Managed affiliate campaigns for sellers & creators',
  description:
    'BubbaAffiliate helps brands, sellers, service providers and educators promote their offers through managed, AI-powered creator, affiliate, and media campaigns.',
  robots: { index: false, follow: false },
};

const NAV: Array<[string, string]> = [
  ['For Sellers', '/sellers'],
  ['For Creators', '/creators'],
  ['How it works', '/how-it-works'],
  ['Pricing', '/pricing'],
];

export default async function BubbaAffiliateLayout({ children }: { children: ReactNode }) {
  const base = await gatewayBase();
  const href = (path = '') => gwHref(base, path);

  return (
    <div className="ba">
      <header className="ba-header">
        <div className="container ba-bar">
          <Link href={href()} className="ba-brand" aria-label="BubbaAffiliate home">
            <span className="ba-brand-mark" aria-hidden="true">B</span>
            <span className="ba-brand-name">Bubba<strong>Affiliate</strong></span>
          </Link>
          <nav className="ba-nav" aria-label="BubbaAffiliate">
            {NAV.map(([label, path]) => (
              <Link key={path} href={href(path)}>{label}</Link>
            ))}
          </nav>
          <div className="ba-header-cta">
            <Link href={`${href('/creators')}#apply`} className="btn btn-ghost">Become a Creator</Link>
            <Link href={`${href('/sellers')}#apply`} className="btn btn-accent">Submit Your Offer</Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="ba-footer">
        <div className="container">
          <div className="ba-footer-top">
            <div className="ba-footer-brand">
              <span className="ba-brand-name">Bubba<strong>Affiliate</strong></span>
              <p>
                A managed affiliate operating company. We help sellers and service providers promote their
                offers through creator, affiliate, and media campaigns — and we handle the operations.
              </p>
            </div>
            <div className="ba-footer-col">
              <h4>For sellers</h4>
              <Link href={href('/sellers')}>Submit an offer</Link>
              <Link href={href('/how-it-works')}>How it works</Link>
              <Link href={href('/pricing')}>Pricing</Link>
            </div>
            <div className="ba-footer-col">
              <h4>For creators</h4>
              <Link href={href('/creators')}>Become a Creator Partner</Link>
              <Link href={`${href('/creators')}#apply`}>Apply now</Link>
            </div>
            <div className="ba-footer-col">
              <h4>Company</h4>
              <Link href={href()}>Overview</Link>
              <Link href={href('/how-it-works')}>How it works</Link>
            </div>
          </div>
          <div className="ba-footer-bottom">
            <span>© 2026 BubbaAffiliate. A Bubba Holding company.</span>
            <span className="ba-meta">
              Content is published across independent media properties, including{' '}
              <a href="https://exploringtoknow.com" rel="nofollow noopener" target="_blank">ExploringToKnow</a>.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
