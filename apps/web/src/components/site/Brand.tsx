import Link from 'next/link';

/** Shared ExploringToKnow wordmark + logo. Used in the header, drawer, and footer. */
export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="brand" aria-label="ExploringToKnow home" onClick={onClick}>
      <span className="brandmark" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5c2.2 2 3.2 4.2 3.2 6.4A3.2 3.2 0 0 1 8 11.1a3.2 3.2 0 0 1-3.2-3.2c0-2.2 1-4.4 3.2-6.4Z" fill="currentColor" />
          <path d="M8 8.4v6.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <span>Exploring<b>To</b>Know</span>
    </Link>
  );
}
