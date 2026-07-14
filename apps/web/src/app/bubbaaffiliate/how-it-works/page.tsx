import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How it works — BubbaAffiliate',
  description:
    'From offer to outcome: how BubbaAffiliate reviews offers, sets campaign terms, produces content, matches creators, distributes, tracks attribution, and manages commissions and payouts.',
};

const STEPS = [
  { n: '1', t: 'Seller submits an offer', d: 'A brand, seller, service provider, or educator submits a product or offer through the gateway — with images, links, a description, and a proposed commission. No account or software required.' },
  { n: '2', t: 'AI + team review', d: 'We analyze the offer for clarity, market and audience fit, campaign angles, compliance, creator fit, and tracking feasibility. Nothing runs until it passes review.' },
  { n: '3', t: 'Campaign terms are set', d: 'BubbaAffiliate defines the commission pool, the creator/house split, the validation window, the payout hold, attribution rules, and any allowed or forbidden claims.' },
  { n: '4', t: 'Creators are matched', d: 'Creator Partners are matched to the offer by niche, platform, audience, content style, and past performance — and receive a clear brief.' },
  { n: '5', t: 'Assets & content direction', d: 'We produce campaign assets — captions, hooks, scripts, article angles, and copy — AI-assisted and human-reviewed before anything is published.' },
  { n: '6', t: 'Distribution', d: 'Content goes out through creator social accounts, affiliate links, promo codes, and independent media properties. No fake engagement, no spam.' },
  { n: '7', t: 'Tracking & attribution', d: 'Clicks, leads, sales, and conversions are tracked and attributed to the right creator, campaign, and content source.' },
  { n: '8', t: 'Validation & fraud control', d: 'Before a commission is approved, each conversion is checked for refunds, duplicates, invalid traffic, and disputes.' },
  { n: '9', t: 'Payout & reporting', d: 'Sellers fund the commission pool; BubbaAffiliate validates and manages payouts to creators. Both sides get performance reports. Creators are never paid directly by sellers.' },
  { n: '10', t: 'Learning & optimization', d: 'Every campaign produces data on what categories, creators, angles, and formats perform — which makes the next campaign better.' },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="ba-hero">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h1>From offer to <em>measurable outcome</em>.</h1>
          <p className="lede">
            BubbaAffiliate is the operating engine behind the campaign. Sellers submit offers; we handle
            review, campaign terms, content, creator distribution, tracking, attribution, validation,
            commissions, and payouts — and we learn from every campaign.
          </p>
          <div className="ba-hero-actions">
            <Link href="/bubbaaffiliate/sellers#apply" className="btn btn-accent btn-lg">Submit Your Offer</Link>
            <Link href="/bubbaaffiliate/creators#apply" className="btn btn-ghost btn-lg">Become a Creator Partner</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="ba-step">
                <span className="ba-num" aria-hidden="true">{s.n}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-band">
            <h2>The software runs the operation. You get the outcome.</h2>
            <p>Do not buy the software. Use the outcome. Submit your offer or apply as a Creator Partner to get started.</p>
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
