'use client';
import { useState } from 'react';

type Category = { id: string | number; name: string };

export function RequestProductForm({ categories }: { categories: Category[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending'); setMessage('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/product-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setState('ok');
        setMessage('Thanks! Your request was submitted and is awaiting editorial review.');
        form.reset();
      } else {
        setState('err');
        setMessage(json.error || 'Something went wrong. Please check the form and try again.');
      }
    } catch {
      setState('err');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {state === 'ok' ? <div className="notice ok">{message}</div> : null}
      {state === 'err' ? <div className="notice err">{message}</div> : null}

      {/* Honeypot — must stay empty */}
      <div className="hp" aria-hidden="true">
        <label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="field">
        <label htmlFor="requesterName">Your name <span className="req">*</span></label>
        <input id="requesterName" name="requesterName" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="requesterEmail">Email <span className="req">*</span></label>
        <input id="requesterEmail" name="requesterEmail" type="email" required maxLength={160} />
      </div>
      <div className="field">
        <label htmlFor="productName">Product name <span className="req">*</span></label>
        <input id="productName" name="productName" required maxLength={200} />
      </div>
      <div className="field">
        <label htmlFor="brand">Brand</label>
        <input id="brand" name="brand" maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="productUrl">Product URL <span className="req">*</span></label>
        <input id="productUrl" name="productUrl" type="url" required placeholder="https://…" />
      </div>
      <div className="field">
        <label htmlFor="affiliateUrl">Affiliate URL (optional)</label>
        <input id="affiliateUrl" name="affiliateUrl" type="url" placeholder="https://… (if you have one)" />
      </div>
      <div className="field">
        <label htmlFor="requestedCategory">Category</label>
        <select id="requestedCategory" name="requestedCategory" defaultValue="">
          <option value="">— Select —</option>
          {categories.map((c) => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" maxLength={2000} />
      </div>
      <button className="btn btn-accent" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Submitting…' : 'Submit request'}
      </button>
      <p className="meta" style={{ marginTop: 12 }}>
        Submissions are reviewed by an editor before any article is created or published. We never auto-publish.
      </p>
    </form>
  );
}
