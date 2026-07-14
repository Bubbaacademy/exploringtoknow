import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import '../(site)/site.css';
import './bubbaaffiliate.css';

/**
 * BubbaAffiliate public gateway shell (Phase 1B / 2A).
 *
 * Deliberately a SEPARATE top-level segment (not under the ExploringToKnow (site)
 * chrome) so the gateway reads as its own commercial brand — BubbaAffiliate = the
 * managed affiliate engine; ExploringToKnow = a media/publishing layer. Reuses the
 * shared design tokens from site.css plus a small gateway-specific stylesheet.
 *
 * NOTE: robots = noindex for now. These pages are served under the ExploringToKnow
 * domain until bubbaaffiliate.com DNS is live; flip to index when on the real domain.
 */
export const metadata: Metadata = {
  title: 'BubbaAffiliate — Managed affiliate campaigns for sellers & creators',
  description:
    'BubbaAffiliate helps brands, sellers, service providers and educators promote their offers through managed, AI-powered creator, affiliate, and media campaigns.',
  robots: { index: false, follow: false },
};

const NAV: Array<[string, string]> = [
  ['For Sellers', '/bubbaaffiliate/sellers'],
  ['For Creators', '/bubbaaffiliate/creators'],
  ['How it works', '/bubbaaffiliate/how-it-works'],
  ['Pricing', '/bubbaaffiliate/pricing'],
];

export default function BubbaAffiliateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ba">
      <header className="ba-header">
        <div className="container ba-bar">
          <Link href="/bubbaaffiliate" className="ba-brand" aria-label="BubbaAffiliate home">
            <span className="ba-brand-mark" aria-hidden="true">B</span>
            <span className="ba-brand-name">Bubba<strong>Affiliate</strong></span>
          </Link>
          <nav className="ba-nav" aria-label="BubbaAffiliate">
            {NAV.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <div className="ba-header-cta">
            <Link href="/bubbaaffiliate/creators#apply" className="btn btn-ghost">Become a Creator</Link>
            <Link href="/bubbaaffiliate/sellers#apply" className="btn btn-accent">Submit Your Offer</Link>
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
              <Link href="/bubbaaffiliate/sellers">Submit an offer</Link>
              <Link href="/bubbaaffiliate/how-it-works">How it works</Link>
              <Link href="/bubbaaffiliate/pricing">Pricing</Link>
            </div>
            <div className="ba-footer-col">
              <h4>For creators</h4>
              <Link href="/bubbaaffiliate/creators">Become a Creator Partner</Link>
              <Link href="/bubbaaffiliate/creators#apply">Apply now</Link>
            </div>
            <div className="ba-footer-col">
              <h4>Company</h4>
              <Link href="/bubbaaffiliate">Overview</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div className="ba-footer-bottom">
            <span>© 2026 BubbaAffiliate. A Bubba Holding company.</span>
            <span className="ba-meta">
              Content is published across independent media properties, including{' '}
              <a href="/" rel="nofollow">ExploringToKnow</a>.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
