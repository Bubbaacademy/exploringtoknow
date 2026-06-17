'use client';
import { useState } from 'react';

const LABELS: Record<string, string> = { workspace_admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };

export function AcceptInvite(props: {
  token: string; inviteEmail: string; role: string; workspaceName: string;
  status: string; expired: boolean; loggedInEmail: string | null;
}) {
  const { token, inviteEmail, status, expired, loggedInEmail } = props;
  const [state, setState] = useState<'idle' | 'sending' | 'err'>('idle');
  const [message, setMessage] = useState('');

  async function accept(extra: Record<string, unknown> = {}) {
    if (state === 'sending') return;
    setState('sending'); setMessage('');
    try {
      const res = await fetch('/api/auth/accept-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...extra }) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { window.location.href = j.redirect || '/app'; return; }
      setState('err'); setMessage(j.error || 'Could not accept the invitation.');
    } catch { setState('err'); setMessage('Network error. Please try again.'); }
  }

  if (status !== 'pending' || expired) {
    return (
      <div className="empty-panel" role="status">
        <span className="eyebrow">{expired ? 'Expired' : status === 'accepted' ? 'Already accepted' : 'Unavailable'}</span>
        <h2>This invitation can’t be used</h2>
        <p>{expired ? 'This invitation has expired.' : status === 'accepted' ? 'This invitation has already been accepted.' : 'This invitation is no longer valid.'} Please ask the workspace owner to send a new one.</p>
        <div className="empty-panel-actions"><a href="/login" className="btn btn-ghost">Sign in</a></div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); }}>
      <div aria-live="polite">{state === 'err' ? <div className="notice err" role="alert">{message}</div> : null}</div>

      {loggedInEmail ? (
        loggedInEmail.toLowerCase() === inviteEmail.toLowerCase() ? (
          <>
            <p className="hint">Signed in as <strong>{loggedInEmail}</strong>.</p>
            <button type="button" className="btn btn-accent btn-lg btn-block" disabled={state === 'sending'} onClick={() => accept()}>
              {state === 'sending' ? 'Joining…' : 'Accept invitation'}
            </button>
          </>
        ) : (
          <div className="notice err" role="alert">
            You’re signed in as <strong>{loggedInEmail}</strong>, but this invitation is for <strong>{inviteEmail}</strong>.{' '}
            <a href="/api/auth/logout">Sign out</a> and sign in with {inviteEmail} to accept.
          </div>
        )
      ) : (
        <>
          <fieldset className="form-section">
            <legend>Create your account</legend>
            <div className="field"><label>Email</label><input type="email" value={inviteEmail} disabled readOnly /></div>
            <div className="field"><label htmlFor="fn">Full name <span className="req">*</span></label><input id="fn" name="fullName" required maxLength={120} autoComplete="name" /></div>
            <div className="field"><label htmlFor="pw">Password <span className="req">*</span></label><input id="pw" name="password" type="password" required minLength={8} autoComplete="new-password" /><span className="hint">At least 8 characters.</span></div>
          </fieldset>
          <button
            type="button" className="btn btn-accent btn-lg btn-block" disabled={state === 'sending'}
            onClick={() => {
              const form = document.querySelector('form.form') as HTMLFormElement | null;
              const fullName = (form?.querySelector('#fn') as HTMLInputElement)?.value || '';
              const password = (form?.querySelector('#pw') as HTMLInputElement)?.value || '';
              accept({ fullName, password });
            }}
          >
            {state === 'sending' ? 'Creating…' : 'Create account & join'}
          </button>
          <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>
            Already have an account with {inviteEmail}? <a href="/login">Sign in</a>, then reopen this invite link to accept.
          </p>
        </>
      )}
    </form>
  );
}
