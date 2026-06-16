'use client';

import { useId, useState } from 'react';

type Variant = 'section' | 'footer' | 'inline';

/**
 * Tasteful, editorial newsletter sign-up. Posts to /api/newsletter (server-validated,
 * deduped). No external provider. `source` records where the sign-up came from.
 */
export function NewsletterSignup({ source, variant = 'section' }: { source: string; variant?: Variant }) {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'already' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const id = useId();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source, company }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState(j.already ? 'already' : 'ok');
        setMsg(j.already ? 'You’re already on the list — thank you!' : 'Thanks! You’re subscribed.');
        setEmail('');
      } else {
        setState('err');
        setMsg(j.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setState('err');
      setMsg('Network error. Please try again.');
    }
  }

  const done = state === 'ok' || state === 'already';

  const heading = 'Practical buying advice, in your inbox';
  const copy = 'Get practical buying guides and honest product research in your inbox.';

  return (
    <section className={`newsletter newsletter-${variant}`} aria-label="Newsletter sign-up">
      <div className="newsletter-inner">
        <div className="newsletter-copy">
          {variant !== 'footer' ? <span className="eyebrow">Stay in the know</span> : null}
          <h3>{variant === 'footer' ? 'Get the newsletter' : heading}</h3>
          <p>{copy}</p>
        </div>
        {done ? (
          <p className="newsletter-done" role="status">{msg}</p>
        ) : (
          <form className="newsletter-form" onSubmit={onSubmit} noValidate>
            <div className="hp" aria-hidden="true">
              <label>Company<input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
            </div>
            <label htmlFor={id} className="sr-only">Email address</label>
            <input
              id={id}
              type="email"
              name="email"
              required
              maxLength={200}
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-accent" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
            {state === 'err' ? <span className="newsletter-err" role="alert">{msg}</span> : null}
          </form>
        )}
        <p className="newsletter-fine">No spam. Unsubscribe anytime. We never sell your email.</p>
      </div>
    </section>
  );
}
