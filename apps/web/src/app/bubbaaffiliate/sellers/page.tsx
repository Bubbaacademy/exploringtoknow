import type { Metadata } from 'next';
import Link from 'next/link';
import { SellerIntakeForm } from '@/components/bubbaaffiliate/SellerIntakeForm';

export const metadata: Metadata = {
  title: 'For Sellers & Brands — BubbaAffiliate',
  description:
    'Submit your product, service, or offer. BubbaAffiliate runs managed creator, affiliate, and media campaigns to promote it — with tracking, attribution, reporting, and commission control.',
};

const VALUE = [
  { t: 'You submit; we operate', d: 'No software to run, no ad accounts to manage. Submit your offer and our team designs and operates the campaign.' },
  { t: 'Creator & media distribution', d: 'Your offer reaches real audiences through matched Creator Partners, affiliate links, and media placements.' },
  { t: 'Measured, not guessed', d: 'Clicks, leads, and sales are tracked and attributed. You get performance reports — not vanity metrics.' },
];

const YOURS = ['Product claims & accuracy', 'Fulfillment & shipping', 'Inventory', 'Customer service & refunds'];
const OURS = ['Campaign design & terms', 'Content direction (AI-assisted, human-reviewed)', 'Creator matching & distribution', 'Tracking, attribution & reporting', 'Commission logic & payouts'];

export default function SellersPage() {
  return (
    <>
      <section className="ba-hero">
        <div className="container">
          <span className="eyebrow">For sellers, brands &amp; service providers</span>
          <h1>Submit your offer. <em>We sell the outcome.</em></h1>
          <p className="lede">
            Whether it&apos;s a physical product, an Amazon or Shopify listing, a service, a course, or a
            high-ticket offer — BubbaAffiliate promotes it through managed creator, affiliate, and media
            campaigns, and reports on measurable results.
          </p>
          <div className="ba-hero-actions">
            <Link href="#apply" className="btn btn-accent btn-lg">Submit Your Offer</Link>
            <Link href="/bubbaaffiliate/pricing" className="btn btn-ghost btn-lg">See pricing</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="ba-cards">
            {VALUE.map((v) => (
              <div key={v.t} className="ba-card">
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Clear responsibilities</span>
              <h2>Who does what</h2>
            </div>
          </div>
          <div className="ba-split">
            <div className="ba-side">
              <h3>You keep</h3>
              <ul>{YOURS.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="ba-side">
              <h3>We handle</h3>
              <ul>{OURS.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* Intake */}
      <section className="section" id="apply" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Submit Your Offer</span>
              <h2>Tell us what you want promoted</h2>
            </div>
          </div>
          <div className="ba-form-wrap">
            <SellerIntakeForm />
          </div>
        </div>
      </section>
    </>
  );
}
