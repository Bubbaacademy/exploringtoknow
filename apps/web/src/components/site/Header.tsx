import Link from 'next/link';

export function Header() {
  return (
    <header className="site-header">
      <div className="container bar">
        <Link href="/" className="brand">ExploringToKnow</Link>
        <nav className="nav">
          <Link href="/categories">Categories</Link>
          <Link href="/request-product">Request a product</Link>
          <Link href="/request-product" className="btn btn-accent">Submit a request</Link>
        </nav>
      </div>
    </header>
  );
}
