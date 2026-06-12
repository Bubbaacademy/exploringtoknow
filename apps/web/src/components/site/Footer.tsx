import Link from 'next/link';
import { AFFILIATE_DISCLOSURE, SITE_NAME } from '@/lib/public';

export function Footer() {
  const year = 2026;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="disclosure">{AFFILIATE_DISCLOSURE}</div>
        <div className="cols" style={{ marginTop: 20 }}>
          <div>© {year} {SITE_NAME}</div>
          <nav className="nav" style={{ gap: 18 }}>
            <Link href="/">Home</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/request-product">Request a product</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
