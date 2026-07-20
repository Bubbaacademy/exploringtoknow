import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Affiliate Disclosure — ${SITE_NAME}`,
  description: 'ExploringToKnow may earn a commission from qualifying purchases made through affiliate links, at no extra cost to you. Our editorial recommendations remain independent.',
  alternates: { canonical: `${SITE_URL}/affiliate-disclosure` },
};

export default function AffiliateDisclosurePage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Affiliate Disclosure</span></nav>
        <span className="eyebrow">Transparency</span>
        <h1>Affiliate Disclosure</h1>
        <p className="doc-lede">
          ExploringToKnow is reader-supported. We want to be clear about how that works.
        </p>
      </header>

      <div className="prose">
        <h2>What this means</h2>
        <p>
          Some of the links on this site are affiliate links. If you click one and make a purchase, we may earn a
          commission from qualifying purchases — <strong>at no extra cost to you</strong>. The price you pay is the
          same whether or not you use our link.
        </p>

        <h2>Our recommendations stay independent</h2>
        <p>
          Earning a commission never decides what we recommend or how we rank products. Our editorial picks are made
          on the merits, following our <Link href="/editorial-policy">editorial policy</Link>. We don’t accept
          payment for favorable coverage, and we don’t publish sponsored rankings.
        </p>

        <h2>How affiliate links are handled</h2>
        <ul>
          <li>Affiliate destinations are entered manually by our team — never auto-injected.</li>
          <li>Outbound affiliate links use appropriate attributes (such as <code>sponsored</code>, <code>nofollow</code>, and <code>noopener</code>).</li>
          <li>Articles with an affiliate relationship carry a visible disclosure near the top.</li>
        </ul>

        <h2>Why we use affiliate links</h2>
        <p>
          Affiliate commissions help fund the research and editorial review that go into every guide, so we can keep
          our recommendations free to read and independent.
        </p>

        <h2>Questions</h2>
        <p>
          If anything here isn’t clear, you can <Link href="/contact">contact us</Link> and an editor will get back
          to you.
        </p>
      </div>

      <div className="doc-cta">
        <Link href="/editorial-policy" className="btn btn-ghost">Editorial policy</Link>
        <Link href="/about" className="btn btn-ghost">About us</Link>
      </div>
    </article>
  );
}
