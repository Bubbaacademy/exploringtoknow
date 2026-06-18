'use client';
import { useState } from 'react';
import { limitText, type Plan } from '@/lib/plans';

export function BillingClient({ plans, currentPlanId }: { plans: Plan[]; currentPlanId: string }) {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function upgrade(planId: string) {
    setBusy(planId); setMsg('');
    try {
      const r = await fetch('/api/app/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: planId }) });
      const j = await r.json().catch(() => ({}));
      if (j.url) { window.location.href = j.url; return; }
      setMsg(j.error || 'Could not start checkout.');
    } catch { setMsg('Network error. Please try again.'); }
    finally { setBusy(''); }
  }
  async function portal() {
    setBusy('portal'); setMsg('');
    try {
      const r = await fetch('/api/app/billing/portal', { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (j.url) { window.location.href = j.url; return; }
      setMsg(j.error || 'Billing portal is unavailable.');
    } catch { setMsg('Network error. Please try again.'); }
    finally { setBusy(''); }
  }

  return (
    <>
      {msg ? <div className="adm-panel" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}
      <div className="adm-cols-2">
        {plans.map((p) => (
          <div key={p.id} className="adm-card">
            <h3>{p.label} {p.id === currentPlanId ? <span className="adm-badge ok">current</span> : null}</h3>
            <p className="adm-note">{p.blurb}</p>
            <div style={{ fontSize: 20, fontWeight: 750, margin: '6px 0' }}>{p.priceText}</div>
            <ul style={{ margin: '0 0 12px', paddingLeft: 16, fontSize: 13, color: 'var(--a-ink-soft)' }}>
              <li>{limitText(p.limits.teamMembers)} team members</li>
              <li>{limitText(p.limits.requestsPerMonth)} requests / month</li>
              <li>{limitText(p.limits.mediaUploads)} media uploads</li>
              <li>{p.limits.customDomain ? 'Custom domain' : 'No custom domain'}</li>
            </ul>
            {p.priceEnvKey ? (
              <button className="adm-btn adm-btn-block" disabled={busy === p.id || p.id === currentPlanId} onClick={() => upgrade(p.id)}>
                {busy === p.id ? 'Starting…' : p.id === currentPlanId ? 'Current plan' : `Upgrade to ${p.label}`}
              </button>
            ) : (
              <a className="adm-btn adm-btn-block ghost" href="/contact" style={{ textAlign: 'center', display: 'block' }}>Contact sales</a>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="adm-btn ghost" disabled={busy === 'portal'} onClick={portal}>Manage billing</button>
      </div>
    </>
  );
}
