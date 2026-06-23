'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  provider: string;
  canManage: boolean;
  configured: boolean;
  comingSoon: boolean;
  connectionId: string | number | null;
  connectionStatus: string | null;
};

/**
 * Provider connection controls (Phase 30, foundation-only). Owner/admin can add a
 * connection record, run the readiness "Connect" check, disconnect, or remove. NO
 * provider API is called and NO token is exchanged here — "Connect" returns a readiness
 * result (live connect is enabled in Phase 31). Editors/viewers see status only.
 */
export function ProviderConnectionControls({ provider, canManage, configured, comingSoon, connectionId, connectionStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  if (comingSoon) return <p className="adm-note">Coming soon — not available to connect yet.</p>;
  if (!canManage) return <p className="adm-note">Only an owner or admin can connect this provider. You can view status.</p>;

  async function call(url: string, method: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : JSON.stringify({ provider }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) {
        if (j.code === 'not_configured') setErr('Google Ads isn’t available to connect yet — ExploringToKnow is finishing Google Ads API setup.');
        else setErr(j.error || `Request failed (${r.status}).`);
      } else if (j.authorizeUrl) { window.location.href = j.authorizeUrl; return j; } // live OAuth redirect
      else { setMsg(j.message || 'Done.'); router.refresh(); }
      return j;
    } catch { setErr('Network error.'); return null; }
    finally { setBusy(false); }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 8 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 8 }}>{msg}</div> : null}

      {!configured ? (
        <p className="adm-note" style={{ marginBottom: 8 }}>
          <strong>Not available yet.</strong> ExploringToKnow is finishing Google Ads API setup. Once that’s done you’ll be
          able to connect your own Google Ads account here with one click. Manual performance import remains available as a fallback.
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="adm-btn" disabled={busy || !configured}
          onClick={() => call(`/api/app/provider-connections/oauth/${provider}/start`, 'POST')}>
          {!configured ? 'Connect (setup pending)' : connectionStatus === 'connected' ? 'Reconnect / change account' : 'Connect Google Ads'}
        </button>

        {!connectionId ? (
          <button type="button" className="adm-btn ghost" disabled={busy}
            onClick={() => call('/api/app/provider-connections', 'POST')}>Add connection record</button>
        ) : (
          <>
            <button type="button" className="adm-btn ghost" disabled={busy}
              onClick={() => call(`/api/app/provider-connections/${connectionId}/disconnect`, 'POST')}>Disconnect</button>
            <button type="button" className="adm-btn ghost" disabled={busy}
              onClick={() => { if (confirm('Remove this connection record?')) call(`/api/app/provider-connections/${connectionId}`, 'DELETE'); }}>Remove</button>
          </>
        )}
      </div>
      {connectionStatus ? <p className="adm-note" style={{ marginTop: 6 }}>Record status: <strong>{connectionStatus}</strong></p> : null}
    </div>
  );
}
