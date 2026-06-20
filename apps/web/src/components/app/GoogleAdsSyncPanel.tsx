'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Account = { id: string | number; providerAccountId: string; providerAccountName: string; selected: boolean };
type Props = {
  connectionId: string | number;
  connected: boolean;
  canManage: boolean;
  accounts: Account[];
  lastSync: string | null;
  lastError: string | null;
};

/**
 * Google Ads read-sync controls (Phase 31). Owner/admin can pick the synced account and
 * run a READ-ONLY sync over a date window. Nothing in Google Ads is changed.
 */
export function GoogleAdsSyncPanel({ connectionId, connected, canManage, accounts, lastSync, lastError }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  if (!connected) return <p className="adm-note" style={{ marginTop: 10 }}>Connect Google Ads above to enable read-only syncing. Nothing in Google Ads is changed.</p>;

  async function selectAccount(providerAccountId: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/provider-connections/${connectionId}/select-account`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerAccountId }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not change account.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function sync() {
    setBusy(true); setErr(''); setMsg('');
    try {
      const body: Record<string, string> = {};
      if (start) body.startDate = start;
      if (end) body.endDate = end;
      const r = await fetch(`/api/app/provider-connections/${connectionId}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || (Array.isArray(j.missingEnv) ? `Not configured: ${j.missingEnv.join(', ')}` : 'Sync failed.'));
      else { setMsg(`Synced ${j.recordsWritten} day-rows (${j.windowStart} → ${j.windowEnd}). Read-only — nothing in Google Ads changed.`); router.refresh(); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  const selected = accounts.find((a) => a.selected) || accounts[0];

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--adm-line, #e5e0d6)', paddingTop: 12 }}>
      <div className="adm-row" style={{ marginBottom: 8 }}><span className="t">Google Ads read sync</span></div>
      <p className="adm-note" style={{ marginBottom: 8 }}>Read-only. Nothing changes in Google Ads · no campaigns are launched · no budgets are changed. Metrics are synced from the Google Ads API and labeled <code>api_synced</code>.</p>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 8 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 8 }}>{msg}</div> : null}

      <div className="adm-row"><span className="t">Connected account</span>
        {accounts.length ? (
          canManage ? (
            <select className="adm-select" value={selected ? String(selected.providerAccountId) : ''} disabled={busy} onChange={(e) => selectAccount(e.target.value)}>
              {accounts.map((a) => <option key={a.id} value={String(a.providerAccountId)}>{a.providerAccountName || a.providerAccountId}{a.selected ? ' (selected)' : ''}</option>)}
            </select>
          ) : <strong>{selected ? (selected.providerAccountName || selected.providerAccountId) : '—'}</strong>
        ) : <span className="adm-note">No accounts discovered yet.</span>}
      </div>
      <div className="adm-row"><span className="t">Last sync</span><strong>{lastSync ? new Date(lastSync).toISOString().slice(0, 16).replace('T', ' ') : '—'}</strong></div>
      {lastError ? <div className="adm-row"><span className="t">Last error</span><span className="adm-note">{lastError}</span></div> : null}

      {canManage ? (
        <div style={{ marginTop: 10 }}>
          <div className="adm-cols-2" style={{ maxWidth: 420 }}>
            <div className="field"><label>From (optional)</label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="field"><label>To (optional)</label><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <button type="button" className="adm-btn" disabled={busy || !accounts.length} onClick={sync}>{busy ? 'Syncing…' : 'Sync last 30 days'}</button>
          <p className="adm-note" style={{ marginTop: 6 }}>Leave dates empty for the last 30 days. Max window 90 days.</p>
        </div>
      ) : <p className="adm-note" style={{ marginTop: 8 }}>Only an owner or admin can run a sync.</p>}
    </div>
  );
}
