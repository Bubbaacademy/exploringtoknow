'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AD_PLATFORM_LABELS, AD_CREATIVE_FORMAT_LABELS, AD_STATUS_LABELS, adStatusVariant, isSafeHttpUrl } from '@/lib/ads-constants';

type SocialOpt = { id: string | number; label: string; text: string };
type Opt = { id: string | number; label: string; url: string };
type Creative = {
  id: string | number; name?: string; platform?: string; format?: string; status?: string;
  headline?: string; primaryText?: string; description?: string; ctaLabel?: string; ctaUrl?: string;
  displayPath?: string; keywords?: string; creativeNotes?: string; disclosureText?: string;
  relatedSocialPost?: string | number | null; relatedLandingPage?: string | number | null;
};

const BLANK = {
  name: '', platform: 'generic', format: 'text_ad', headline: '', primaryText: '', description: '',
  ctaLabel: '', ctaUrl: '', displayPath: '', keywords: '', creativeNotes: '', disclosureText: '',
  relatedSocialPost: '', relatedLandingPage: '',
};

export function AdCreativeManager({ campaignId, creatives = [], socialPosts = [], landingPages = [] }:
  { campaignId: string | number; creatives?: Creative[]; socialPosts?: SocialOpt[]; landingPages?: Opt[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Record<string, string>>({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  function startNew() { setEditingId(null); setF({ ...BLANK }); setOpen(true); setErr(''); setMsg(''); }
  function startEdit(c: Creative) {
    setEditingId(c.id);
    setF({
      name: c.name || '', platform: c.platform || 'generic', format: c.format || 'text_ad',
      headline: c.headline || '', primaryText: c.primaryText || '', description: c.description || '',
      ctaLabel: c.ctaLabel || '', ctaUrl: c.ctaUrl || '', displayPath: c.displayPath || '',
      keywords: c.keywords || '', creativeNotes: c.creativeNotes || '', disclosureText: c.disclosureText || '',
      relatedSocialPost: String(c.relatedSocialPost ?? ''), relatedLandingPage: String(c.relatedLandingPage ?? ''),
    });
    setOpen(true); setErr(''); setMsg('');
  }

  function importCopy() {
    const sp = socialPosts.find((s) => String(s.id) === f.relatedSocialPost);
    if (sp?.text) { set('primaryText', sp.text); setMsg('Imported the social post text — edit it for this ad.'); setErr(''); }
    else setErr('Pick a social post with text to import.');
  }

  async function save() {
    if (!f.name.trim()) { setErr('Give the creative a name.'); return; }
    if (f.ctaUrl && !isSafeHttpUrl(f.ctaUrl)) { setErr('CTA URL must start with http:// or https://.'); return; }
    setBusy(true); setErr(''); setMsg('');
    const body = {
      ...f, campaign: campaignId,
      relatedSocialPost: f.relatedSocialPost || null, relatedLandingPage: f.relatedLandingPage || null,
    };
    try {
      const r = editingId
        ? await fetch(`/api/app/ad-creatives/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/app/ad-creatives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not save creative.');
      else { setOpen(false); setEditingId(null); router.refresh(); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function act(id: string | number, action: string) {
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/ad-creatives/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not update.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }
  async function del(id: string | number) {
    if (!confirm('Delete this creative?')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/ad-creatives/${id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not delete.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  return (
    <div className="adm-card" style={{ marginTop: 16 }}>
      <div className="adm-row" style={{ marginBottom: 8 }}>
        <span className="t">Ad creatives ({creatives.length})</span>
        <button type="button" className="adm-btn" onClick={startNew}>Add creative</button>
      </div>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 8 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 8 }}>{msg}</div> : null}

      {creatives.length ? creatives.map((c) => (
        <div key={String(c.id)} style={{ border: '1px solid var(--adm-line, #e5e0d6)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div className="adm-row">
            <span className="t">{c.name || '(untitled)'} <span className="adm-badge">{AD_PLATFORM_LABELS[String(c.platform)] || String(c.platform)}</span> <span className="adm-badge">{AD_CREATIVE_FORMAT_LABELS[String(c.format)] || String(c.format)}</span> <span className={`adm-badge ${adStatusVariant(String(c.status))}`}>{AD_STATUS_LABELS[String(c.status)] || String(c.status)}</span></span>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => startEdit(c)}>Edit</button>
              {c.status !== 'approved_to_export' ? <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => act(c.id, 'approve')}>Approve</button> : <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => act(c.id, 'draft')}>Draft</button>}
              <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => del(c.id)}>Delete</button>
            </span>
          </div>
          {c.headline ? <p className="adm-note" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{c.headline}</p> : null}
        </div>
      )) : <p className="adm-note">No creatives yet. Add headline + primary text variants for this campaign.</p>}

      {open ? (
        <div style={{ borderTop: '1px solid var(--adm-line, #e5e0d6)', marginTop: 8, paddingTop: 12 }}>
          <strong>{editingId ? 'Edit creative' : 'New creative'}</strong>
          <div className="field" style={{ marginTop: 8 }}><label>Name</label><input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={200} /></div>
          <div className="adm-cols-2">
            <div className="field"><label>Platform</label><select className="adm-select" value={f.platform} onChange={(e) => set('platform', e.target.value)}>{Object.entries(AD_PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="field"><label>Format</label><select className="adm-select" value={f.format} onChange={(e) => set('format', e.target.value)}>{Object.entries(AD_CREATIVE_FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          {socialPosts.length ? (
            <div className="field"><label>Import copy from social post</label>
              <span style={{ display: 'flex', gap: 6 }}>
                <select className="adm-select" value={f.relatedSocialPost} onChange={(e) => set('relatedSocialPost', e.target.value)}>
                  <option value="">— none —</option>{socialPosts.map((s) => <option key={s.id} value={String(s.id)}>{s.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={importCopy} disabled={!f.relatedSocialPost}>Import copy</button>
              </span>
              <p className="adm-note">Copies the post text into Primary text — edit it for the ad. Nothing is generated.</p>
            </div>
          ) : null}
          {landingPages.length ? (
            <div className="field"><label>Related landing page</label>
              <select className="adm-select" value={f.relatedLandingPage} onChange={(e) => set('relatedLandingPage', e.target.value)}>
                <option value="">— none —</option>{landingPages.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
              </select>
            </div>
          ) : null}
          <div className="field"><label>Headlines (one per line)</label><textarea rows={3} value={f.headline} onChange={(e) => set('headline', e.target.value)} maxLength={4000} /></div>
          <div className="field"><label>Primary text</label><textarea rows={4} value={f.primaryText} onChange={(e) => set('primaryText', e.target.value)} maxLength={8000} /></div>
          <div className="field"><label>Description</label><textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={4000} /></div>
          <div className="adm-cols-2">
            <div className="field"><label>CTA label</label><input value={f.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} maxLength={120} /></div>
            <div className="field"><label>CTA URL (http/https)</label><input value={f.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} maxLength={1000} placeholder="https://…" /></div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label>Display path</label><input value={f.displayPath} onChange={(e) => set('displayPath', e.target.value)} maxLength={200} placeholder="example.com/deals" /></div>
            <div className="field"><label>Keywords</label><input value={f.keywords} onChange={(e) => set('keywords', e.target.value)} maxLength={4000} /></div>
          </div>
          <div className="field"><label>Creative notes</label><textarea rows={2} value={f.creativeNotes} onChange={(e) => set('creativeNotes', e.target.value)} maxLength={4000} /></div>
          <div className="field"><label>Disclosure / compliance</label><textarea rows={2} value={f.disclosureText} onChange={(e) => set('disclosureText', e.target.value)} maxLength={2000} /></div>
          <button type="button" className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : editingId ? 'Save creative' : 'Add creative'}</button>
          <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => { setOpen(false); setEditingId(null); }} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
}
