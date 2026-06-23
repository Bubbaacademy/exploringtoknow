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
  connectedAt: string | null;
  lastError: string | null;
};

const fmtTs = (v: string | null): string => {
  if (!v) return '';
  try { return new Date(v).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; } catch { return ''; }
};

/**
 * Meta Ads read-sync controls (Phase 32). Owner/admin/super can discover ad accounts,
 * pick one, and run a READ-ONLY insights sync. Nothing in the Meta ad account is changed;
 * no tokens/secrets are shown.
 */
export function MetaAdsSyncPanel({ connectionId, connected, canManage, accounts, lastSync, connectedAt, lastError }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  if (!connected) return <p className="adm-note" style={{ marginTop: 10 }}>Connect Meta Ads above to enable read-only syncing. Nothing in your Meta ad account is changed.</p>;

  async function post(url: string): Promise<Record<string, unknown> | null> {
    setBusy(true); setErr(''); setMsg('');
    try {
      const body: Record<string, string> = {};
      if (url.endsWith('/sync')) { if (start) body.startDate = start; if (end) body.endDate = end; }
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr((j.error || 'Request failed.') + (j.detail ? `  [${j.detail}]` : '')); return j; }
      return j;
    } catch { setErr('Network error.'); return null; } finally { setBusy(false); }
  }

  async function discover() {
    const j = await post(`/api/app/provider-connections/${connectionId}/discover-accounts`);
    if (j?.ok) {
      const n = Number(j.discovered || 0);
      if (n === 0) setErr('Connected, but Meta returned no readable ad accounts. Likely cause: this Meta login has no ad accounts, or your app’s ads_read permission hasn’t been approved for this account yet (Advanced Access / App Review). Reconnect with an account you manage.');
      else { setMsg(`Discovered ${n} ad account${n === 1 ? '' : 's'}.`); router.refresh(); }
    }
  }

  async function selectAccount(providerAccountId: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/provider-connections/${connectionId}/select-account`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerAccountId }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not change account.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function sync() {
    const j = await post(`/api/app/provider-connections/${connectionId}/sync`);
    if (j?.ok) { setMsg(`Synced ${j.recordsWritten} day-rows (${j.windowStart} → ${j.windowEnd}). Read-only — nothing in Meta Ads changed.`); router.refresh(); }
  }

  const selected = accounts.find((a) => a.selected) || accounts[0] || null;
  const hasAccounts = accounts.length > 0;

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--adm-line, #e5e0d6)', paddingTop: 12 }}>
      <div className="adm-row" style={{ marginBottom: 8 }}><span className="t">Meta Ads read sync</span></div>
      <p className="adm-note" style={{ marginBottom: 8 }}>Read-only. Nothing changes in Meta Ads · no campaigns are launched · no budgets are changed. Metrics sync from the Meta Ads Insights API and are labeled <code>api_synced</code>.</p>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 8 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 8 }}>{msg}</div> : null}

      <div className="adm-row"><span className="t">Connected on</span><strong>{fmtTs(connectedAt) || '—'}</strong></div>
      <div className="adm-row"><span className="t">Last sync</span><strong>{lastSync ? fmtTs(lastSync) : 'Not synced yet'}</strong></div>
      {lastError ? <div className="adm-row"><span className="t">Last error</span><span className="adm-note">{lastError}</span></div> : null}

      {hasAccounts ? (
        <>
          <div className="adm-row"><span className="t">Connected account</span>
            {canManage && accounts.length > 1 ? (
              <select className="adm-select" value={selected ? String(selected.providerAccountId) : ''} disabled={busy} onChange={(e) => selectAccount(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={String(a.providerAccountId)}>{(a.providerAccountName || `Account ${a.providerAccountId}`)} · {a.providerAccountId}{a.selected ? ' · selected' : ''}</option>)}
              </select>
            ) : (
              <strong>{selected ? `${selected.providerAccountName || `Account ${selected.providerAccountId}`} · ${selected.providerAccountId}` : '—'}</strong>
            )}
          </div>
          {canManage ? (
            <div style={{ marginTop: 10 }}>
              <div className="adm-cols-2" style={{ maxWidth: 420 }}>
                <div className="field"><label>From (optional)</label><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                <div className="field"><label>To (optional)</label><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
              </div>
              <button type="button" className="adm-btn" disabled={busy} onClick={sync}>Sync last 30 days</button>
              <button type="button" className="adm-btn ghost" disabled={busy} onClick={discover} style={{ marginLeft: 8 }}>Refresh accounts</button>
              <p className="adm-note" style={{ marginTop: 6 }}>Leave dates empty for the last 30 days. Max window 90 days.</p>
            </div>
          ) : <p className="adm-note" style={{ marginTop: 8 }}>Only an owner or admin can run a sync.</p>}
        </>
      ) : (
        <div style={{ marginTop: 8 }}>
          <p className="adm-note" style={{ marginBottom: 8 }}><strong>Connected — account discovery hasn’t run yet.</strong> Discover the Meta ad accounts this login can read (read-only).</p>
          {canManage ? <button type="button" className="adm-btn" disabled={busy} onClick={discover}>Discover accounts</button>
            : <p className="adm-note">Only an owner or admin can discover accounts.</p>}
        </div>
      )}
    </div>
  );
}
