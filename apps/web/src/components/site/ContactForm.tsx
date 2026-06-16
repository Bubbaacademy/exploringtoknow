'use client';

import { useState } from 'react';

const REASONS = [
  { value: 'suggest_product', label: 'Suggest a product' },
  { value: 'correction', label: 'Editorial correction' },
  { value: 'partnership', label: 'Partnership / affiliate inquiry' },
  { value: 'general', label: 'General question' },
];

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState('ok');
        setMessage('Thanks — your message has been received. We read every message and will follow up if needed.');
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

      <div className="field"><label htmlFor="c-name">Your name <span className="opt">(optional)</span></label><input id="c-name" name="name" maxLength={120} autoComplete="name" /></div>
      <div className="field"><label htmlFor="c-email">Email <span className="req">*</span></label><input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
      <div className="field">
        <label htmlFor="c-reason">Reason</label>
        <select id="c-reason" name="reason" defaultValue="general">
          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="c-subject">Subject <span className="opt">(optional)</span></label><input id="c-subject" name="subject" maxLength={200} /></div>
      <div className="field"><label htmlFor="c-product">Product URL <span className="opt">(optional)</span></label><input id="c-product" name="productUrl" type="url" placeholder="https://…" /></div>
      <div className="field"><label htmlFor="c-message">Message <span className="req">*</span></label><textarea id="c-message" name="message" required minLength={10} maxLength={5000} placeholder="How can we help?" /></div>

      <button className="btn btn-accent btn-lg btn-block" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>We typically reply to genuine inquiries. Suggesting a product? You can also use the <a href="/request-product">request form</a>.</p>
    </form>
  );
}
