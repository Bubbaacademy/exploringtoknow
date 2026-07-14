import type { Metadata } from 'next';
import Link from 'next/link';
import { CreatorIntakeForm } from '@/components/bubbaaffiliate/CreatorIntakeForm';
import { gatewayBase, gwHref } from '@/lib/gateway';

export const metadata: Metadata = {
  title: 'Become a Creator Partner — BubbaAffiliate',
  description:
    'Creators, influencers, and affiliates: get matched with offers that fit your audience, receive content direction and tracking links, and earn commissions on validated conversions. Free to apply.',
};

const PERKS = [
  { t: 'Matched to your audience', d: 'We pair you with offers that fit your niche, platform, and content style — not random spam.' },
  { t: 'Everything you need to post', d: 'Content briefs, captions, hooks, tracking links, and promo codes — with clear allowed and forbidden claims.' },
  { t: 'Get paid for what works', d: 'Earn commissions on validated conversions. Payouts are managed by BubbaAffiliate — you never chase sellers.' },
];

const WHO = ['Instagram / TikTok / YouTube creators', 'Bloggers & newsletter owners', 'Community & group owners', 'Affiliate marketers & micro-influencers'];

export default async function CreatorsPage() {
  const base = await gatewayBase();
  return (
    <>
      <section className="ba-hero">
        <div className="container">
          <span className="eyebrow">For creators, influencers &amp; affiliates</span>
          <h1>Earn on campaigns <em>built for your audience</em>.</h1>
          <p className="lede">
            Become a Creator Partner and promote offers that actually fit your following. We provide the
            content direction, tracking, and offers — you bring your audience and earn commissions on
            validated conversions. Free to apply, no membership fees.
          </p>
          <div className="ba-hero-actions">
            <Link href="#apply" className="btn btn-accent btn-lg">Become a Creator Partner</Link>
            <Link href={gwHref(base, '/how-it-works')} className="btn btn-ghost btn-lg">How it works</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-cards">
            {PERKS.map((p) => (
              <div key={p.t} className="ba-card">
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-split">
            <div className="ba-side">
              <span className="eyebrow">Who this is for</span>
              <h3>If you have an audience, you can earn</h3>
              <ul>{WHO.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="ba-side">
              <span className="eyebrow">How you get paid</span>
              <h3>Simple, validated, managed</h3>
              <p>Creator Partners typically receive the majority of each offer&apos;s commission pool. Payouts are released after conversions are validated (to protect against refunds and fraud). See the full split on our pricing page.</p>
              <Link href={gwHref(base, '/pricing')} className="btn btn-ghost">See the commission split →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="section" id="apply" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Creator Partner application</span>
              <h2>Apply to join the network</h2>
            </div>
          </div>
          <div className="ba-form-wrap">
            <CreatorIntakeForm />
          </div>
        </div>
      </section>
    </>
  );
}
