'use client';
import { useState } from 'react';
import { ASSET_TYPE_LABELS, ASSET_PERMISSION_LABELS } from '@/lib/brandkit-constants';

type Profile = Record<string, string>;
type Asset = { id: string | number; label: string; assetType: string; permission: string; sourceUrl?: string; notes?: string };

const FIELDS: Array<{ key: string; label: string; area?: boolean; ph?: string }> = [
  { key: 'brandName', label: 'Brand / business name', ph: 'Acme Outdoors' },
  { key: 'publicationName', label: 'Publication name', ph: 'The Trailhead' },
  { key: 'websiteUrl', label: 'Website URL', ph: 'https://example.com' },
  { key: 'description', label: 'Short brand description', area: true, ph: 'What the brand is and what it sells.' },
  { key: 'targetAudience', label: 'Target audience', area: true, ph: 'Who you are writing for.' },
  { key: 'brandVoice', label: 'Brand voice / tone', area: true, ph: 'e.g. practical, warm, no hype.' },
  { key: 'editorialStyle', label: 'Editorial style notes', area: true, ph: 'Formatting, do/don’t, structure.' },
  { key: 'focusNotes', label: 'Product / category focus notes', area: true, ph: 'Categories and products to emphasize.' },
  { key: 'affiliateDisclosure', label: 'Affiliate disclosure preference / notes', area: true, ph: 'How disclosures should read, if used.' },
  { key: 'socialLinks', label: 'Social profile URLs (one per line)', area: true, ph: 'https://instagram.com/...' },
];

export function BrandKitClient({ profile, assets }: { profile: Profile; assets: Asset[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(''); setErr('');
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    for (const f of FIELDS) payload[f.key] = String(fd.get(f.key) ?? '');
    payload.primaryColor = String(fd.get('primaryColor') ?? '');
    payload.accentColor = String(fd.get('accentColor') ?? '');
    try {
      const r = await fetch('/api/app/brand', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not save.'); else setMsg('Brand profile saved.');
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function addAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr('');
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/app/brand/assets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: fd.get('label'), assetType: fd.get('assetType'), permission: fd.get('permission'), sourceUrl: fd.get('sourceUrl'), notes: fd.get('notes') }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not add asset.'); else location.reload();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function removeAsset(id: Asset['id']) {
    if (!confirm('Remove this asset entry?')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/app/brand/assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not remove.'); else location.reload();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      <section className="adm-section">
        <div className="adm-section-head"><h2>Brand profile</h2></div>
        <div className="adm-card">
          <form className="form" onSubmit={saveProfile}>
            {FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label htmlFor={f.key}>{f.label}</label>
                {f.area
                  ? <textarea id={f.key} name={f.key} defaultValue={profile[f.key] || ''} placeholder={f.ph} rows={3} maxLength={2000} />
                  : <input id={f.key} name={f.key} defaultValue={profile[f.key] || ''} placeholder={f.ph} maxLength={300} />}
              </div>
            ))}
            <div className="field"><label htmlFor="primaryColor">Primary color (hex)</label><input id="primaryColor" name="primaryColor" defaultValue={profile.primaryColor || ''} placeholder="#14543f" maxLength={16} /></div>
            <div className="field"><label htmlFor="accentColor">Accent color (hex)</label><input id="accentColor" name="accentColor" defaultValue={profile.accentColor || ''} placeholder="#c9a227" maxLength={16} /></div>
            <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save brand profile'}</button>
          </form>
        </div>
      </section>

      <section className="adm-section">
        <div className="adm-section-head"><h2>Asset library</h2></div>
        <div className="adm-card">
          <p className="adm-note">Reference entries (logo, brand/product images, documents, links) with a permission label. No files are uploaded here yet — point to a URL or note the location. Future phases can wire real uploads via the tenant-safe media store.</p>
          {assets.length ? (
            <div style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table className="adm-table">
                <thead><tr><th>Label</th><th>Type</th><th>Permission</th><th>Source</th><th /></tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={String(a.id)}>
                      <td>{a.label}</td>
                      <td>{ASSET_TYPE_LABELS[a.assetType] || a.assetType}</td>
                      <td><span className={`adm-badge ${a.permission === 'permission_cleared' ? 'ok' : a.permission === 'needs_review' ? 'warn' : ''}`}>{ASSET_PERMISSION_LABELS[a.permission] || a.permission}</span></td>
                      <td>{a.sourceUrl ? <a href={a.sourceUrl} target="_blank" rel="noreferrer noopener">link</a> : '—'}</td>
                      <td style={{ textAlign: 'right' }}><button className="adm-btn ghost" disabled={busy} onClick={() => removeAsset(a.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-empty">No assets yet. Add your logo and key brand images below.</p>}

          <form className="form" onSubmit={addAsset} style={{ marginTop: 8 }}>
            <div className="field"><label htmlFor="label">Label <span className="req">*</span></label><input id="label" name="label" required placeholder="Primary logo" maxLength={200} /></div>
            <div className="field"><label htmlFor="assetType">Type</label>
              <select id="assetType" name="assetType" className="adm-select" defaultValue="logo">
                {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="permission">Permission</label>
              <select id="permission" name="permission" className="adm-select" defaultValue="needs_review">
                {Object.entries(ASSET_PERMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="sourceUrl">Source URL <span className="opt">(optional)</span></label><input id="sourceUrl" name="sourceUrl" placeholder="https://…" maxLength={500} /></div>
            <div className="field"><label htmlFor="notes">Notes <span className="opt">(optional)</span></label><input id="notes" name="notes" placeholder="Where it lives, usage notes…" maxLength={300} /></div>
            <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add asset'}</button>
          </form>
        </div>
      </section>
    </>
  );
}
