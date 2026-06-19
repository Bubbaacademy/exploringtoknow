'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SS_CHANNELS, SS_CHANNEL_LABELS } from '@/lib/social-constants';

/**
 * Create a manual content set of EMPTY draft social posts from a landing page (Phase
 * 26). Drafts only — captions are NOT generated, nothing is published/scheduled, no
 * API/AI. CTA prefills from the landing page's published public URL when available.
 */
export function LandingSocialSet({ landingPageId }: { landingPageId: string | number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Record<string, boolean>>({ instagram: true, facebook: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const channels = Object.keys(sel).filter((c) => sel[c]);

  async function create() {
    if (!channels.length) { setErr('Pick at least one channel.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch('/api/app/social-posts/from-landing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingPageId, channels }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not create the content set.');
      else { setMsg(`Created ${j.created?.length || 0} draft${(j.created?.length || 0) === 1 ? '' : 's'}${j.prefilled ? ' with the public URL prefilled' : ''}.`); router.push('/app/social-posts'); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  if (!open) {
    return <div className="adm-panel" style={{ marginTop: 16 }}>
      <strong>Social content set</strong> — create blank social post drafts from this landing page (manual; no copy generated, nothing posted). <button type="button" className="adm-btn ghost" style={{ marginLeft: 8 }} onClick={() => setOpen(true)}>Choose channels</button>
    </div>;
  }

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 8 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 8 }}>{msg}</div> : null}
      <div className="adm-row" style={{ marginBottom: 8 }}><span className="t">Create social drafts from this landing page</span></div>
      <p className="adm-note" style={{ marginBottom: 8 }}>One blank draft per channel, with this landing page linked and its public URL prefilled as the CTA (when published). Captions are written by you — nothing is generated or posted.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {SS_CHANNELS.map((c) => (
          <label key={c} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type="checkbox" checked={!!sel[c]} onChange={(e) => setSel((s) => ({ ...s, [c]: e.target.checked }))} /> {SS_CHANNEL_LABELS[c]}
          </label>
        ))}
      </div>
      <button type="button" className="adm-btn" disabled={busy || !channels.length} onClick={create}>{busy ? 'Creating…' : `Create ${channels.length} draft${channels.length === 1 ? '' : 's'}`}</button>
      <button type="button" className="adm-btn ghost" style={{ marginLeft: 8 }} onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
    </div>
  );
}
