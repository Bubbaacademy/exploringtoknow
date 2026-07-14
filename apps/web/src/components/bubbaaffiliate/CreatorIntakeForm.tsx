'use client';

import { useState } from 'react';

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Blog / website', 'Newsletter', 'Community / group', 'Other'];

/**
 * Creator Partner / influencer / affiliate application. Posts to
 * /api/bubbaaffiliate/intake (kind=creator), which stores a `contact-messages` doc.
 * Interest collection only — no CreatorProfile tables, no social OAuth, no account
 * connection. Creators pay nothing; they get earning opportunities on matched campaigns.
 */
export function CreatorIntakeForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMessage('');
    const form = e.currentTarget;
    const data = { kind: 'creator', ...Object.fromEntries(new FormData(form).entries()) };
    try {
      const res = await fetch('/api/bubbaaffiliate/intake', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState('ok');
        setMessage('Thanks — your application has been received. We review every applicant and will reach out with matched campaign opportunities.');
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
        <div className="field"><label htmlFor="c-name">Your name <span className="opt">(optional)</span></label><input id="c-name" name="name" maxLength={120} autoComplete="name" /></div>
        <div className="field"><label htmlFor="c-email">Email <span className="req">*</span></label><input id="c-email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
      </div>
      <div className="ba-form-grid">
        <div className="field">
          <label htmlFor="c-platform">Primary platform</label>
          <select id="c-platform" name="platform" defaultValue="">
            <option value="">Select…</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="c-handle">Handle / channel <span className="opt">(optional)</span></label><input id="c-handle" name="handle" maxLength={160} placeholder="@yourhandle" /></div>
      </div>
      <div className="ba-form-grid">
        <div className="field"><label htmlFor="c-url">Profile URL <span className="opt">(optional)</span></label><input id="c-url" name="profileUrl" type="url" placeholder="https://…" /></div>
        <div className="field"><label htmlFor="c-audience">Audience size / niche <span className="opt">(optional)</span></label><input id="c-audience" name="audience" maxLength={200} placeholder="e.g. 25k, home & DIY" /></div>
      </div>
      <div className="field"><label htmlFor="c-about">Tell us about your audience &amp; content <span className="req">*</span></label><textarea id="c-about" name="about" required minLength={10} maxLength={5000} placeholder="What do you post about, who follows you, and what kinds of offers fit your audience?" /></div>

      <button className="btn btn-accent btn-lg btn-block" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Submitting…' : 'Become a Creator Partner'}
      </button>
      <p className="ba-note">Free to apply. We review every applicant and match you with campaigns that fit your audience. You earn commissions on validated conversions — no membership fees.</p>
    </form>
  );
}
