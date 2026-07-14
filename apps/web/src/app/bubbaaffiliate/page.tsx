import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'BubbaAffiliate — Sell the outcome, not the software',
  description:
    'BubbaAffiliate helps brands, sellers, service providers and educators promote their offers through managed, AI-powered creator, affiliate, and media campaigns. Sellers submit offers; Creator Partners promote and earn.',
};

const HOW = [
  { n: '1', t: 'Submit your offer', d: 'Sellers share a product, service, or offer. No account, no software to learn — just tell us what you want promoted.' },
  { n: '2', t: 'We build the campaign', d: 'BubbaAffiliate reviews the offer, sets campaign terms, and produces content direction with our AI-assisted, human-reviewed process.' },
  { n: '3', t: 'Creators distribute it', d: 'Matched Creator Partners promote the offer to their audiences across social, affiliate links, and media placements.' },
  { n: '4', t: 'You see measurable results', d: 'We track attribution, manage commissions, and report performance. Sellers get outcomes; creators get paid on validated conversions.' },
];

export default function BubbaAffiliateHome() {
  return (
    <>
      {/* Hero */}
      <section className="ba-hero">
        <div className="container">
          <span className="eyebrow">Managed affiliate operating company</span>
          <h1>Promote your offer through <em>creators, affiliates &amp; media</em> — fully managed.</h1>
          <p className="lede">
            BubbaAffiliate helps brands, sellers, service providers and educators turn offers into measurable
            results. You don&apos;t buy software or run tools — we run the campaign: content direction, creator
            distribution, tracking, attribution, reporting, and commission control.
          </p>
          <div className="ba-hero-actions">
            <Link href="/bubbaaffiliate/sellers#apply" className="btn btn-accent btn-lg">Submit Your Offer</Link>
            <Link href="/bubbaaffiliate/creators#apply" className="btn btn-ghost btn-lg">Become a Creator Partner</Link>
          </div>
          <div className="ba-hero-trust">
            <span>AI-powered, human-reviewed</span>
            <span>Creator &amp; affiliate distribution</span>
            <span>Tracked &amp; attributed</span>
            <span>Managed commissions</span>
          </div>
        </div>
      </section>

      {/* Two-sided */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">One engine, two sides</span>
              <h2>Sellers bring offers. Creators bring audiences.</h2>
            </div>
          </div>
          <div className="ba-split">
            <div className="ba-side">
              <span className="eyebrow">For sellers &amp; brands</span>
              <h3>Sell the outcome</h3>
              <p>Submit a product, service, course, or offer. We handle promotion end-to-end and report on real performance.</p>
              <ul>
                <li>Managed creator &amp; affiliate campaigns</li>
                <li>AI-assisted content direction, human-reviewed</li>
                <li>Tracking, attribution &amp; performance reports</li>
                <li>You keep fulfillment, shipping &amp; customer service</li>
              </ul>
              <Link href="/bubbaaffiliate/sellers#apply" className="btn btn-accent">Submit Your Offer</Link>
            </div>
            <div className="ba-side">
              <span className="eyebrow">For creators &amp; affiliates</span>
              <h3>Earn on what you already do</h3>
              <p>Get matched with offers that fit your audience, receive ready-to-use content direction, and earn commissions on validated conversions.</p>
              <ul>
                <li>Free to apply — no membership fees</li>
                <li>Campaigns matched to your niche &amp; platform</li>
                <li>Content briefs, tracking links &amp; promo codes</li>
                <li>Transparent, managed payouts on validated sales</li>
              </ul>
              <Link href="/bubbaaffiliate/creators#apply" className="btn btn-accent">Become a Creator Partner</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (brief) */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">How it works</span>
              <h2>Managed from offer to outcome</h2>
            </div>
            <Link href="/bubbaaffiliate/how-it-works" className="section-link">See the full process →</Link>
          </div>
          <div className="ba-cards">
            {HOW.slice(0, 3).map((s) => (
              <div key={s.n} className="ba-card">
                <span className="ba-num" aria-hidden="true">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-band">
            <h2>Ready to turn your offer into results?</h2>
            <p>Submit your offer and we&apos;ll design a managed campaign — or apply as a Creator Partner and start earning on campaigns that fit your audience.</p>
            <div className="ba-hero-actions">
              <Link href="/bubbaaffiliate/sellers#apply" className="btn btn-lg">Submit Your Offer</Link>
              <Link href="/bubbaaffiliate/creators#apply" className="btn btn-ghost btn-lg">Become a Creator Partner</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
