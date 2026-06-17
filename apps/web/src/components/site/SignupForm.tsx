'use client';
import { useState } from 'react';

const SUBMIT_TIMEOUT_MS = 20000;

export function SignupForm({ trialDays }: { trialDays: number }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'verify' | 'err'>('idle');
  const [message, setMessage] = useState('');

  function fail(msg: string) { setState('err'); setMessage(msg); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return; // anti double-submit
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (!data.fullName?.trim()) return fail('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) return fail('Please enter a valid work email.');
    if ((data.password || '').length < 8) return fail('Password must be at least 8 characters.');
    if (!data.businessName?.trim()) return fail('Please enter your business or brand name.');
    if (!data.workspaceName?.trim()) return fail('Please name your publication / workspace.');
    if (!(form.elements.namedItem('terms') as HTMLInputElement)?.checked) return fail('Please accept the terms to continue.');

    setState('sending'); setMessage('');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SUBMIT_TIMEOUT_MS);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: ctrl.signal,
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok && j.verify) {
        setState('verify');
        setMessage(j.message || 'Account created. Check your email to verify before signing in.');
      } else if (res.ok && j.ok) {
        setState('ok');
        // Hard navigation so the new session cookie is picked up server-side.
        window.location.href = j.redirect || '/app';
      } else {
        fail(j.error || 'Something went wrong. Please review the form and try again.');
      }
    } catch (err) {
      fail((err as { name?: string })?.name === 'AbortError'
        ? 'The request timed out. Your details are kept — please try again.'
        : 'Network error. Your details are kept — please try again.');
    } finally {
      clearTimeout(timer);
    }
  }

  if (state === 'ok') {
    return (
      <div className="form">
        <div className="empty-panel" role="status">
          <span className="eyebrow">Welcome aboard</span>
          <h2>Setting up your workspace…</h2>
          <p>Taking you to your dashboard.</p>
        </div>
      </div>
    );
  }
  if (state === 'verify') {
    return (
      <div className="form">
        <div className="empty-panel" role="status">
          <span className="eyebrow">Almost there</span>
          <h2>Check your email</h2>
          <p>{message}</p>
          <div className="empty-panel-actions"><a href="/login" className="btn btn-ghost">Go to sign in</a></div>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div aria-live="polite">{state === 'err' ? <div className="notice err" role="alert">{message}</div> : null}</div>

      <div className="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label></div>

      <fieldset className="form-section">
        <legend>Your account</legend>
        <div className="field"><label htmlFor="fullName">Full name <span className="req">*</span></label><input id="fullName" name="fullName" required maxLength={120} autoComplete="name" /></div>
        <div className="field"><label htmlFor="email">Work email <span className="req">*</span></label><input id="email" name="email" type="email" required maxLength={200} autoComplete="email" /></div>
        <div className="field"><label htmlFor="password">Password <span className="req">*</span></label><input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /><span className="hint">At least 8 characters.</span></div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Your workspace</legend>
        <div className="field"><label htmlFor="businessName">Business / brand name <span className="req">*</span></label><input id="businessName" name="businessName" required maxLength={160} /></div>
        <div className="field"><label htmlFor="workspaceName">Publication / workspace name <span className="req">*</span></label><input id="workspaceName" name="workspaceName" required maxLength={160} /><span className="hint">The name of the site/magazine you’ll run in this workspace.</span></div>
        <div className="field"><label htmlFor="slug">Workspace address <span className="opt">(optional)</span></label><input id="slug" name="slug" maxLength={60} placeholder="your-brand" /><span className="hint">A short handle. We’ll suggest a unique one if it’s taken.</span></div>
        <div className="field"><label htmlFor="website">Website <span className="opt">(optional)</span></label><input id="website" name="website" type="url" maxLength={200} placeholder="https://…" /></div>
      </fieldset>

      <div className="field perm-field">
        <input id="terms" name="terms" type="checkbox" />
        <label htmlFor="terms">I agree to the terms of service and privacy policy. <span className="req">*</span></label>
      </div>

      <button className="btn btn-accent btn-lg btn-block" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Creating your workspace…' : 'Create my workspace'}
      </button>
      <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>
        Free for {trialDays} days · no credit card · nothing publishes automatically. Already have an account? <a href="/login">Sign in</a>.
      </p>
    </form>
  );
}
