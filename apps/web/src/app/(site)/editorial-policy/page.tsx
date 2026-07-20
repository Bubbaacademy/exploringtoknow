import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Editorial Policy — ${SITE_NAME}`,
  description: 'How ExploringToKnow researches, drafts with AI assistance, and human-reviews every guide before publishing — independent, transparent, never auto-published.',
  alternates: { canonical: `${SITE_URL}/editorial-policy` },
};

export default function EditorialPolicyPage() {
  return (
    <article className="doc-page">
      <header className="doc-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span aria-current="page">Editorial Policy</span></nav>
        <span className="eyebrow">Editorial policy</span>
        <h1>How we research, write, and review</h1>
        <p className="doc-lede">
          Our promise is simple: practical, honest guidance you can trust. This policy explains how our content is
          made and the standards we hold it to.
        </p>
      </header>

      <div className="prose">
        <h2>Our standards</h2>
        <p>
          We aim to help readers make good buying decisions. That means being clear about what a product does well,
          where it falls short, and who it’s for — without hype, pressure, or pay-to-win rankings.
        </p>

        <h2>AI assistance, human judgment</h2>
        <p>
          We use AI to assist with research and drafting so we can move faster and stay well-structured. AI is a
          tool, not the publisher. Every guide is reviewed by a person, and claims are held to a human standard
          before anything goes live.
        </p>

        <h2>Human review and publishing</h2>
        <ul>
          <li>Nothing is published automatically. An editor must review and approve a guide before it appears.</li>
          <li>A guide must be assigned a topic/category before it can be published.</li>
          <li>Drafts and in-review content are never shown publicly.</li>
        </ul>

        <h2>Independence</h2>
        <p>
          Some links are affiliate links and may earn us a commission, but commercial relationships never determine
          our recommendations or rankings. Editorial decisions are made on the merits. See our
          {' '}<Link href="/affiliate-disclosure">affiliate disclosure</Link> for details.
        </p>

        <h2>Images</h2>
        <p>
          Product images are manually selected from media submitted for a product — real photographs used with
          permission. We do not use paid AI image-generation services to create product imagery.
        </p>

        <h2>Corrections</h2>
        <p>
          We’re human, and we fix mistakes. If you spot an error or something that’s out of date, you can
          {' '}<Link href="/contact">contact us</Link> and an editor will review it.
        </p>

        <h2>How coverage is decided</h2>
        <p>
          What we cover is an editorial decision, made by editors on the merits of the topic — never sold, and never
          triggered automatically. Commercial relationships do not buy coverage, placement, or ranking.
        </p>
      </div>

      <div className="doc-cta">
        <Link href="/affiliate-disclosure" className="btn btn-ghost">Affiliate disclosure</Link>
        <Link href="/explore-picks" className="btn btn-accent">Read more buying guides</Link>
      </div>
    </article>
  );
}
