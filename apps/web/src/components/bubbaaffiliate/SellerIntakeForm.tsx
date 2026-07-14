'use client';

import { useState } from 'react';

const OFFER_TYPES = [
  'Physical product',
  'Amazon product',
  'Shopify store',
  'TikTok Shop',
  'Service',
  'Course / education',
  'Lead-generation offer',
  'High-ticket offer',
  'Other',
];

/**
 * Seller / brand / service-provider offer intake. Posts to /api/bubbaaffiliate/intake
 * (kind=seller), which stores a `contact-messages` doc. Interest collection only —
 * no account, no dashboard, no schema. BubbaAffiliate reviews every submission.
 */
export function SellerIntakeForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    const form = e.currentTarget;
    const data = { kind: 'seller', ...Object.fromEntries(new FormData(form).entries()) };
    try {
      const res = await fetch('/api/bubbaaffiliate/intake', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState('ok');
        setMessage('Thanks — your offer has been received. Our team reviews every submission and will follow up about a managed campaign.');
        form.reset();
      } else {
        setState('err');
        setMessage(j.error || 'Something went wrong. Please review the form and try again.');
      }
    } catch {
      setState('err');
      setMessage('Network error. Your details are kept — please try again.');
    }
  }

  if (state === 'ok') {
    return <div className="notice ok" role="status">{message}</div>;
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div aria-live="polite">{state === 'err' ? <div className="notice err" role="alert">{message}</div> : null}</div>
      <div className="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="ba-form-grid">
        <div className="field"><label htmlFor="s-name">Your name <span className="opt">(optional)</span></label><input id="s-name" name="name" maxLength={120} autoComplete="name" /></div>
        <div className="field"><label htmlFor="s-email">Email <span className="req">*</span></label><input id="s-email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
      </div>
      <div className="ba-form-grid">
        <div className="field"><label htmlFor="s-business">Business / brand <span className="opt">(optional)</span></label><input id="s-business" name="businessName" maxLength={160} /></div>
        <div className="field">
          <label htmlFor="s-type">Offer type</label>
          <select id="s-type" name="offerType" defaultValue="">
            <option value="">Select…</option>
            {OFFER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="ba-form-grid">
        <div className="field"><label htmlFor="s-website">Website / product URL <span className="opt">(optional)</span></label><input id="s-website" name="website" type="url" placeholder="https://…" /></div>
        <div className="field"><label htmlFor="s-comm">Commission you can offer <span className="opt">(optional)</span></label><input id="s-comm" name="commissionIdea" maxLength={200} placeholder="e.g. $20 per sale, or 15%" /></div>
      </div>
      <div className="field"><label htmlFor="s-offer">What do you want to promote? <span className="req">*</span></label><textarea id="s-offer" name="offer" required minLength={10} maxLength={5000} placeholder="Tell us about your product or service, your audience, and your goal." /></div>

      <button className="btn btn-accent btn-lg btn-block" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Submitting…' : 'Submit Your Offer'}
      </button>
      <p className="ba-note">No account required. This is an intake form — BubbaAffiliate reviews every offer before any campaign begins. You keep fulfillment, shipping, and customer service.</p>
    </form>
  );
}
