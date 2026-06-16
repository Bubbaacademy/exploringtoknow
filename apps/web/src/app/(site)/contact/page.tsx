import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/public';
import { ContactForm } from '@/components/site/ContactForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Contact — ${SITE_NAME}`,
  description: 'Get in touch with the ExploringToKnow editorial team — suggest a product, report a correction, ask about partnerships, or send a general question.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

const REASONS = [
  { t: 'Suggest a product', d: 'Want something reviewed? Tell us — or use the request form for a full submission with images.' },
  { t: 'Editorial corrections', d: 'Spotted an error or something out of date? We fix mistakes.' },
  { t: 'Partnerships & affiliates', d: 'Brand or partnership inquiries are welcome — disclosed transparently.' },
  { t: 'General questions', d: 'Anything else about ExploringToKnow.' },
];

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="request-head">
          <span className="eyebrow">Get in touch</span>
          <h1>Contact us</h1>
          <p className="request-lede">
            We’re a small editorial team. Tell us what you need and we’ll point it to the right place.
          </p>
        </div>

        <div className="contact-reasons">
          {REASONS.map((r) => (
            <div key={r.t} className="contact-reason">
              <h3>{r.t}</h3>
              <p>{r.d}</p>
            </div>
          ))}
        </div>
        <p className="hint" style={{ margin: '8px 0 0' }}>
          Looking to submit a product with photos? The <Link href="/request-product">Request a Review</Link> form is the fastest path.
        </p>
      </div>
      <ContactForm />
    </section>
  );
}
