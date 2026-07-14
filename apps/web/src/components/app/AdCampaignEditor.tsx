'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AD_PLATFORM_LABELS, AD_OBJECTIVE_LABELS, AD_STATUS_LABELS, AD_PLATFORM_HELP,
  adStatusVariant, isSafeHttpUrl, buildTrackingUrl,
} from '@/lib/ads-constants';

type Opt = { id: string | number; label: string; url: string };
type SocialOpt = { id: string | number; label: string; text: string };
type Brand = { publicationName?: string; brandVoice?: string; targetAudience?: string; accentColor?: string; affiliateDisclosure?: string };
type Campaign = {
  id?: string | number; name?: string; platform?: string; objective?: string; status?: string;
  audienceName?: string; audienceNotes?: string; geographyNotes?: string; languageNotes?: string; placementNotes?: string;
  budgetNotes?: string; scheduleNotes?: string; primaryCta?: string; destinationUrl?: string;
  utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string;
  disclosureText?: string; notes?: string; exportCount?: number;
  relatedProduct?: string | number | null; relatedRequest?: string | number | null;
  relatedLandingPage?: string | number | null; relatedSocialPost?: string | number | null;
};

export function AdCampaignEditor({ campaign, products = [], requests = [], landingPages = [], socialPosts = [], brand, brandProfileId }:
  { campaign?: Campaign; products?: Opt[]; requests?: Opt[]; landingPages?: Opt[]; socialPosts?: SocialOpt[]; brand?: Brand | null; brandProfileId?: string | number | null }) {
  const router = useRouter();
  const editing = Boolean(campaign?.id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const status = campaign?.status || 'draft';

  const [platform, setPlatform] = useState(campaign?.platform || 'generic');
  const [destinationURL, setDestinationURL] = useState(campaign?.destinationUrl || '');
  const [utmSource, setUtmSource] = useState(campaign?.utmSource || '');
  const [utmMedium, setUtmMedium] = useState(campaign?.utmMedium || '');
  const [utmCampaign, setUtmCampaign] = useState(campaign?.utmCampaign || '');
  const [utmContent, setUtmContent] = useState(campaign?.utmContent || '');
  const [utmTerm, setUtmTerm] = useState(campaign?.utmTerm || '');
  const [relatedProduct, setRelatedProduct] = useState(String(campaign?.relatedProduct ?? ''));
  const [relatedRequest, setRelatedRequest] = useState(String(campaign?.relatedRequest ?? ''));
  const [relatedLandingPage, setRelatedLandingPage] = useState(String(campaign?.relatedLandingPage ?? ''));
  const [relatedSocialPost, setRelatedSocialPost] = useState(String(campaign?.relatedSocialPost ?? ''));
  const [exp, setExp] = useState<{ text: string; csv: string } | null>(null);

  const trackingUrl = useMemo(
    () => buildTrackingUrl(destinationURL, { source: utmSource, medium: utmMedium, campaign: utmCampaign, content: utmContent, term: utmTerm }),
    [destinationURL, utmSource, utmMedium, utmCampaign, utmContent, utmTerm],
  );

  function prefillFrom(opts: Opt[], selectedId: string) {
    const o = opts.find((x) => String(x.id) === selectedId);
    if (o?.url && isSafeHttpUrl(o.url)) { setDestinationURL(o.url); setMsg('Destination URL prefilled — review and save.'); setErr(''); }
    else setErr('That item has no safe (http/https) link to prefill.');
  }

  function collect(form: HTMLFormElement) {
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '');
    return {
      name: get('name'), platform, objective: get('objective'),
      audienceName: get('audienceName'), audienceNotes: get('audienceNotes'), geographyNotes: get('geographyNotes'),
      languageNotes: get('languageNotes'), placementNotes: get('placementNotes'),
      budgetNotes: get('budgetNotes'), scheduleNotes: get('scheduleNotes'), primaryCta: get('primaryCta'),
      destinationUrl: destinationURL, utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
      disclosureText: get('disclosureText'), notes: get('notes'),
      relatedProduct: relatedProduct || null, relatedRequest: relatedRequest || null,
      relatedLandingPage: relatedLandingPage || null, relatedSocialPost: relatedSocialPost || null,
      relatedBrandProfile: brandProfileId ?? null,
    };
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const data = collect(e.currentTarget);
    if (data.destinationUrl && !isSafeHttpUrl(data.destinationUrl)) { setErr('Destination URL must start with http:// or https://.'); setBusy(false); return; }
    try {
      if (editing) {
        const r = await fetch(`/api/app/ad-campaigns/${campaign!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not save.'); else { setMsg('Saved.'); router.refresh(); }
      } else {
        const r = await fetch('/api/app/ad-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not create.'); else { router.push(`/app/ads/${j.id}`); return; }
      }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function act(action: string) {
    if (action === 'archive' && !confirm('Archive this campaign?')) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/ad-campaigns/${campaign!.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not update status.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function del() {
    if (!confirm('Delete this campaign and its creatives? This cannot be undone.')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/ad-campaigns/${campaign!.id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not delete.'); setBusy(false); } else router.push('/app/ads');
    } catch { setErr('Network error.'); setBusy(false); }
  }

  async function exportCampaign(markExported: boolean) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch('/api/app/ad-campaigns/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [campaign!.id], markExported }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not export.');
      else { setExp({ text: j.text || '', csv: j.csv || '' }); setMsg(`Export ready below.${markExported ? ' Marked as exported.' : ''}`); if (markExported) router.refresh(); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function copy(text: string) {
    try { if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(text); setMsg('Copied to clipboard.'); } else setMsg('Select the text and copy it.'); }
    catch { setMsg('Select the text and copy it.'); }
  }
  function downloadCsv(csv: string) {
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ad-campaign-export.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { setErr('Could not build the CSV. Copy the text instead.'); }
  }

  const accent = brand?.accentColor && /^#?[0-9a-fA-F]{3,8}$/.test(brand.accentColor) ? brand.accentColor : '';

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      {editing ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-row">
            <span className="t">Status <span className={`adm-badge ${adStatusVariant(status)}`}>{AD_STATUS_LABELS[status] || status}</span>{campaign?.exportCount ? <> · exported <strong>{campaign.exportCount}</strong>×</> : null}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {status !== 'ready_for_review' && status !== 'approved_to_export' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('ready')}>Mark ready</button> : null}
              {status !== 'approved_to_export' ? <button className="adm-btn" disabled={busy} onClick={() => act('approve')}>Approve to export</button> : null}
              {status === 'approved_to_export' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Back to draft</button> : null}
              {status !== 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('archive')}>Archive</button> : null}
              {status === 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Restore</button> : null}
            </span>
          </div>
          <p className="adm-note" style={{ marginTop: 8 }}>Manual planning only — nothing launches, spends, or connects an ad account. “Approve to export” unlocks copy-export for manual setup in your Ads Manager.</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="adm-btn" disabled={busy} onClick={() => exportCampaign(false)}>Export campaign + creatives</button>
            <button className="adm-btn ghost" disabled={busy} onClick={() => exportCampaign(true)}>Export &amp; mark exported</button>
          </div>
          {exp ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <button className="adm-btn ghost" onClick={() => copy(exp.text)}>Copy text</button>
                <button className="adm-btn ghost" onClick={() => downloadCsv(exp.csv)}>Download CSV</button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--adm-bg, #faf8f4)', border: '1px solid var(--adm-line, #e5e0d6)', borderRadius: 8, padding: 12, fontFamily: 'inherit', fontSize: 14, maxHeight: 360, overflow: 'auto' }}>{exp.text || '(empty)'}</pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {brand ? (
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Brand Kit context:</strong>{brand.publicationName ? ` ${brand.publicationName} ·` : ''}{brand.brandVoice ? ` voice: ${brand.brandVoice.slice(0, 100)}` : ' set your voice in Brand Kit'}{brand.targetAudience ? ` · audience: ${brand.targetAudience.slice(0, 80)}` : ''}{accent ? <> · accent <span style={{ display: 'inline-block', width: 12, height: 12, background: accent, borderRadius: 3, verticalAlign: 'middle' }} /></> : null}
        </div>
      ) : <div className="adm-panel" style={{ marginBottom: 16 }}>No Brand Kit yet — set one up at <a href="/app/brand">Brand Kit</a> to keep ad copy on-brand.</div>}

      <form className="form" onSubmit={submit}>
        <div className="field"><label htmlFor="name">Campaign name <span className="req">*</span></label><input id="name" name="name" required defaultValue={campaign?.name || ''} maxLength={200} placeholder="Spring sale — Meta traffic" /></div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" className="adm-select" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {Object.entries(AD_PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="objective">Objective</label>
            <select id="objective" name="objective" className="adm-select" defaultValue={campaign?.objective || 'generic'}>
              {Object.entries(AD_OBJECTIVE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <p className="adm-note" style={{ marginTop: -4 }}>{AD_PLATFORM_HELP[platform]}</p>

        <div className="adm-cols-2">
          <div className="field"><label htmlFor="relatedProduct">Related product</label>
            {products.length ? (
              <span style={{ display: 'flex', gap: 6 }}>
                <select id="relatedProduct" className="adm-select" value={relatedProduct} onChange={(e) => setRelatedProduct(e.target.value)}>
                  <option value="">— none —</option>{products.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={() => prefillFrom(products, relatedProduct)} disabled={!relatedProduct}>Use link →</button>
              </span>
            ) : <p className="adm-note">No offers yet. <a href="/app/products">Add one</a>.</p>}
          </div>
          <div className="field"><label htmlFor="relatedLandingPage">Related landing page</label>
            {landingPages.length ? (
              <span style={{ display: 'flex', gap: 6 }}>
                <select id="relatedLandingPage" className="adm-select" value={relatedLandingPage} onChange={(e) => setRelatedLandingPage(e.target.value)}>
                  <option value="">— none —</option>{landingPages.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={() => prefillFrom(landingPages, relatedLandingPage)} disabled={!relatedLandingPage}>Use URL →</button>
              </span>
            ) : <p className="adm-note">No landing pages yet. <a href="/app/landing-pages">Create one</a>.</p>}
          </div>
        </div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="relatedRequest">Related request</label>
            <select id="relatedRequest" className="adm-select" value={relatedRequest} onChange={(e) => setRelatedRequest(e.target.value)}>
              <option value="">— none —</option>{requests.map((r) => <option key={r.id} value={String(r.id)}>{r.label}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="relatedSocialPost">Related social post</label>
            <select id="relatedSocialPost" className="adm-select" value={relatedSocialPost} onChange={(e) => setRelatedSocialPost(e.target.value)}>
              <option value="">— none —</option>{socialPosts.map((s) => <option key={s.id} value={String(s.id)}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="adm-panel" style={{ marginBottom: 12 }}><strong>Audience &amp; targeting</strong> — planning notes only.</div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="audienceName">Audience name</label><input id="audienceName" name="audienceName" defaultValue={campaign?.audienceName || ''} maxLength={200} /></div>
          <div className="field"><label htmlFor="languageNotes">Language</label><input id="languageNotes" name="languageNotes" defaultValue={campaign?.languageNotes || ''} maxLength={500} /></div>
        </div>
        <div className="field"><label htmlFor="audienceNotes">Audience notes</label><textarea id="audienceNotes" name="audienceNotes" rows={2} defaultValue={campaign?.audienceNotes || ''} maxLength={4000} /></div>
        <div className="field"><label htmlFor="geographyNotes">Geography notes</label><textarea id="geographyNotes" name="geographyNotes" rows={2} defaultValue={campaign?.geographyNotes || ''} maxLength={2000} /></div>
        <div className="field"><label htmlFor="placementNotes">Placement notes</label><textarea id="placementNotes" name="placementNotes" rows={2} defaultValue={campaign?.placementNotes || ''} maxLength={2000} /></div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="budgetNotes">Budget notes (planning only — not real spend)</label><textarea id="budgetNotes" name="budgetNotes" rows={2} defaultValue={campaign?.budgetNotes || ''} maxLength={2000} /></div>
          <div className="field"><label htmlFor="scheduleNotes">Schedule notes (planning only)</label><textarea id="scheduleNotes" name="scheduleNotes" rows={2} defaultValue={campaign?.scheduleNotes || ''} maxLength={2000} /></div>
        </div>

        <div className="adm-panel" style={{ marginBottom: 12 }}><strong>Destination &amp; UTM builder</strong> — composes a tracking URL. No links are shortened, tracked, or called.</div>
        <div className="field"><label htmlFor="primaryCta">Primary CTA</label><input id="primaryCta" name="primaryCta" defaultValue={campaign?.primaryCta || ''} maxLength={120} placeholder="Shop now" /></div>
        <div className="field"><label htmlFor="destinationURL">Destination URL (http/https only)</label><input id="destinationURL" value={destinationURL} onChange={(e) => setDestinationURL(e.target.value)} maxLength={1000} placeholder="https://…" /></div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="utmSource">utm_source</label><input id="utmSource" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} maxLength={200} placeholder="meta" /></div>
          <div className="field"><label htmlFor="utmMedium">utm_medium</label><input id="utmMedium" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} maxLength={200} placeholder="cpc" /></div>
        </div>
        <div className="adm-cols-2">
          <div className="field"><label htmlFor="utmCampaign">utm_campaign</label><input id="utmCampaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} maxLength={200} placeholder="spring_sale" /></div>
          <div className="field"><label htmlFor="utmContent">utm_content</label><input id="utmContent" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} maxLength={200} /></div>
        </div>
        <div className="field"><label htmlFor="utmTerm">utm_term</label><input id="utmTerm" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} maxLength={200} /></div>
        <div className="field"><label>Final tracking URL (preview)</label>
          <div className="adm-card" style={{ wordBreak: 'break-all' }}>{trackingUrl || <span className="adm-note">Enter a valid http(s) destination URL to build the tracking URL.</span>}</div>
          {trackingUrl ? <button type="button" className="adm-btn ghost" style={{ marginTop: 6 }} onClick={() => copy(trackingUrl)}>Copy tracking URL</button> : null}
        </div>

        <div className="field"><label htmlFor="disclosureText">Disclosure / compliance notes</label><textarea id="disclosureText" name="disclosureText" rows={2} defaultValue={campaign?.disclosureText || ''} maxLength={2000} /></div>
        <div className="field"><label htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" rows={2} defaultValue={campaign?.notes || ''} maxLength={4000} /></div>

        <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}</button>
        {editing ? <button className="adm-btn ghost" type="button" disabled={busy} onClick={del} style={{ marginLeft: 8 }}>Delete</button> : null}
      </form>
    </>
  );
}
