import Link from 'next/link';
import { AFFILIATE_DISCLOSURE, SITE_NAME } from '@/lib/public';

export function Footer() {
  const year = 2026;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="brand" aria-label="ExploringToKnow home">
              <span className="brandmark" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5c2.2 2 3.2 4.2 3.2 6.4A3.2 3.2 0 0 1 8 11.1a3.2 3.2 0 0 1-3.2-3.2c0-2.2 1-4.4 3.2-6.4Z" fill="currentColor" />
                  <path d="M8 8.4v6.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span>Exploring<b>To</b>Know</span>
            </Link>
            <p>Practical buying guides and product reviews — manually researched and human-reviewed before anything goes live.</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/request-product">Request a review</Link>
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <Link href="/request-product">How we work</Link>
            <Link href="/request-product">Submit a product</Link>
          </div>
        </div>

        <div className="disclosure">{AFFILIATE_DISCLOSURE}</div>

        <div className="footer-bottom">
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
          <span className="meta">Independently reviewed · Reader-supported</span>
        </div>
      </div>
    </footer>
  );
}
