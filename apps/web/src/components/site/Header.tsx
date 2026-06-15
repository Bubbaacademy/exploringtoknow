import Link from 'next/link';

export function Header() {
  return (
    <header className="site-header">
      <div className="container bar">
        <Link href="/" className="brand" aria-label="ExploringToKnow home">
          <span className="brandmark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5c2.2 2 3.2 4.2 3.2 6.4A3.2 3.2 0 0 1 8 11.1a3.2 3.2 0 0 1-3.2-3.2c0-2.2 1-4.4 3.2-6.4Z" fill="currentColor" />
              <path d="M8 8.4v6.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>Exploring<b>To</b>Know</span>
        </Link>
        <nav className="nav">
          <Link href="/categories" className="nav-link">Categories</Link>
          <Link href="/request-product" className="nav-link">Request a review</Link>
          <Link href="/request-product" className="btn btn-accent">Submit a request</Link>
        </nav>
      </div>
    </header>
  );
}
