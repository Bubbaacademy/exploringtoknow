import Link from 'next/link';
import { AFFILIATE_DISCLOSURE, SITE_NAME } from '@/lib/public';
import { Brand } from './Brand';
import { PRIMARY_NAV, CTA, TOPICS_HREF } from '@/lib/nav';

export function Footer() {
  const year = 2026;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Brand />
            <p>Practical buying guides and product reviews — manually researched and human-reviewed before anything goes live.</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <Link href="/">Home</Link>
            <Link href={TOPICS_HREF}>Topics</Link>
            {PRIMARY_NAV.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <Link href="/search">Search</Link>
            <Link href={CTA.href}>{CTA.label}</Link>
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
