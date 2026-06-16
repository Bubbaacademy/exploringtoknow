import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { CTA } from '@/lib/nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `About — ${SITE_NAME}`,
  description: 'ExploringToKnow helps readers make practical buying decisions without the hype — researched, AI-assisted in drafting, and human-reviewed before publishing.',
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">About</span></nav>
        <span className="eyebrow">About us</span>
        <h1>Helping you choose well, without the hype</h1>
        <p className="doc-lede">
          ExploringToKnow is an independent buying-guide magazine. We exist to help readers make practical
          purchasing decisions with clear, honest research — not marketing spin.
        </p>
      </header>

      <div className="prose">
        <h2>What we do</h2>
        <p>
          We publish buying guides and product reviews that focus on what actually matters: what a product is
          good for, where it falls short, and whether it’s worth your money. Our goal is simple — give you
          enough genuine, well-organized information to decide with confidence.
        </p>

        <h2>How our guides are made</h2>
        <p>Every guide goes through the same disciplined process:</p>
        <ul>
          <li><strong>Researched, not scraped.</strong> Each guide starts from real product research and the questions readers actually ask.</li>
          <li><strong>AI-assisted in drafting.</strong> We use AI to help research and draft faster and stay structured — but it is a tool, not the editor.</li>
          <li><strong>Human editorial review.</strong> Nothing is published until a person has reviewed it. There is no auto-publishing and no sponsored rankings.</li>
        </ul>

        <h2>Independent recommendations</h2>
        <p>
          Some links on our site are affiliate links, which means we may earn a commission when you buy through
          them — at no extra cost to you. That never decides what we recommend. Our editorial picks are made on
          the merits. You can read the details in our <Link href="/affiliate-disclosure">affiliate disclosure</Link>
          and <Link href="/editorial-policy">editorial policy</Link>.
        </p>

        <h2>About our images</h2>
        <p>
          The product images you see are manually selected from media submitted for a product — real photos, used
          with permission. We do not use paid AI image-generation services to fabricate product imagery.
        </p>

        <h2>Request a review</h2>
        <p>
          Want a specific product covered? Anyone can <Link href={CTA.href}>request a review</Link>. Every request
          is read by an editor before any guide is created or published.
        </p>
      </div>

      <div className="doc-cta">
        <Link href={CTA.href} className="btn btn-accent">{CTA.label}</Link>
        <Link href="/categories" className="btn btn-ghost">Browse topics</Link>
      </div>
    </article>
  );
}
