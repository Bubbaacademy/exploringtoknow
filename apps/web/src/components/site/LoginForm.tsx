'use client';
import { useState } from 'react';

export function LoginForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (!data.email || !data.password) { setState('err'); setMessage('Enter your email and password.'); return; }
    setState('sending'); setMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setState('ok'); window.location.href = j.redirect || '/app'; }
      else { setState('err'); setMessage(j.error || 'Invalid email or password.'); }
    } catch {
      setState('err'); setMessage('Network error. Please try again.');
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div aria-live="polite">{state === 'err' ? <div className="notice err" role="alert">{message}</div> : null}</div>
      <fieldset className="form-section">
        <legend>Sign in</legend>
        <div className="field"><label htmlFor="email">Email <span className="req">*</span></label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div className="field"><label htmlFor="password">Password <span className="req">*</span></label><input id="password" name="password" type="password" required autoComplete="current-password" /></div>
      </fieldset>
      <button className="btn btn-accent btn-lg btn-block" type="submit" disabled={state === 'sending'} aria-busy={state === 'sending'}>
        {state === 'sending' ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
