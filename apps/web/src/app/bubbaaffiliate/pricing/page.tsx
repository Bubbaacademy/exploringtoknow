import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — BubbaAffiliate',
  description:
    'Simple early pricing: onboarding/activation from $99, campaign operation from $99/month, plus a performance split on validated conversions. Managed service — not a software subscription.',
};

const ONBOARDING = [
  { name: 'Basic', price: 99, featured: false, items: ['Offer review & setup', 'Campaign terms defined', 'Added to the creator network'] },
  { name: 'Standard', price: 299, featured: true, items: ['Everything in Basic', 'Priority offer review', 'Expanded creator matching', 'Content direction kit'] },
  { name: 'Premium', price: 499, featured: false, items: ['Everything in Standard', 'Hands-on launch support', 'Priority campaign scheduling'] },
];

const OPERATION = [
  { name: 'Basic', price: 99, featured: false, items: ['Ongoing campaign coordination', 'Content & QA', 'Standard performance reporting'] },
  { name: 'Standard', price: 299, featured: true, items: ['Everything in Basic', 'More creators & placements', 'Attribution reporting', 'Optimization pass'] },
  { name: 'Premium', price: 599, featured: false, items: ['Everything in Standard', 'Dedicated campaign management', 'Advanced reporting & optimization'] },
];

function Tier({ tier, per }: { tier: { name: string; price: number; featured: boolean; items: string[] }; per?: string }) {
  return (
    <div className={`ba-tier${tier.featured ? ' is-featured' : ''}`}>
      <div className="ba-tier-name">{tier.name}{tier.featured ? <span className="ba-tier-badge">Popular</span> : null}</div>
      <div className="ba-price"><span className="amt">${tier.price}</span>{per ? <span className="per">{per}</span> : null}</div>
      <ul>{tier.items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <section className="ba-hero">
        <div className="container">
          <span className="eyebrow">Simple, early pricing</span>
          <h1>Pay for <em>managed outcomes</em>, not software.</h1>
          <p className="lede">
            BubbaAffiliate is a managed service. You&apos;re not buying a tool or a subscription to run yourself —
            you&apos;re paying us to operate creator, affiliate, and media campaigns for your offer. Early pricing
            is intentionally low while we build proof, and may be discounted or waived for early partners.
          </p>
        </div>
      </section>

      {/* Onboarding */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">One-time</span>
              <h2>Onboarding / activation</h2>
            </div>
          </div>
          <div className="ba-pricing">
            {ONBOARDING.map((t) => <Tier key={t.name} tier={t} />)}
          </div>
        </div>
      </section>

      {/* Operation */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Monthly</span>
              <h2>Campaign operation</h2>
            </div>
          </div>
          <div className="ba-pricing">
            {OPERATION.map((t) => <Tier key={t.name} tier={t} per="/month" />)}
          </div>
        </div>
      </section>

      {/* Performance split */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Performance split</span>
              <h2>How the commission pool is shared</h2>
            </div>
          </div>
          <p className="ba-note" style={{ margin: '0 0 20px' }}>
            Sellers fund a commission pool per sale, lead, or conversion. After a conversion is validated, the
            pool is split between the Creator Partner and BubbaAffiliate:
          </p>
          <div className="ba-splits">
            <div className="ba-split-card">
              <h3>Products</h3>
              <div className="ba-split-row">
                <span className="lab">Creator Partner</span>
                <span className="ba-meter"><i className="creator" style={{ width: '70%' }} /><i className="house" style={{ width: '30%' }} /></span>
                <span className="pct">70%</span>
              </div>
              <div className="ba-split-row">
                <span className="lab">BubbaAffiliate</span>
                <span className="ba-meter"><i className="house" style={{ width: '30%' }} /></span>
                <span className="pct">30%</span>
              </div>
            </div>
            <div className="ba-split-card">
              <h3>Services</h3>
              <div className="ba-split-row">
                <span className="lab">Creator Partner</span>
                <span className="ba-meter"><i className="creator" style={{ width: '60%' }} /><i className="house" style={{ width: '40%' }} /></span>
                <span className="pct">60%</span>
              </div>
              <div className="ba-split-row">
                <span className="lab">BubbaAffiliate</span>
                <span className="ba-meter"><i className="house" style={{ width: '40%' }} /></span>
                <span className="pct">40%</span>
              </div>
            </div>
          </div>
          <p className="ba-note" style={{ marginTop: 16 }}>
            Example: on a product offer with a <strong>$20</strong> commission pool per sale, the Creator Partner
            earns <strong>$14</strong> and BubbaAffiliate keeps <strong>$6</strong>. Services carry a higher
            operational share (60% / 40%) because they typically require qualification, follow-up, and validation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-band">
            <h2>Start with a single offer</h2>
            <p>Submit your offer and we&apos;ll recommend the right onboarding and operation plan for your goals.</p>
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
