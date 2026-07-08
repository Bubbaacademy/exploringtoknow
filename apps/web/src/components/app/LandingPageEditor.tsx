'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LP_PAGE_TYPE_LABELS, LP_STATUS_LABELS, lpStatusVariant, isSafeHttpUrl, type Section } from '@/lib/landing-constants';
import { SectionsEditor } from './SectionsEditor';

type Opt = { id: string | number; label: string; url: string };
type Brand = { publicationName?: string; brandVoice?: string; accentColor?: string; affiliateDisclosure?: string };
type LP = {
  id?: string | number; title?: string; slug?: string; status?: string; pageType?: string;
  headline?: string; subheadline?: string; body?: string; ctaLabel?: string; ctaUrl?: string;
  disclosureText?: string; seoTitle?: string; seoDescription?: string; noindex?: boolean; publishedAt?: string;
  relatedProduct?: string | number | null; relatedRequest?: string | number | null; sections?: Section[];
};

export function LandingPageEditor({ page, workspaceSlug, products = [], requests = [], brand, views = 0 }:
  { page?: LP; workspaceSlug?: string; products?: Opt[]; requests?: Opt[]; brand?: Brand | null; views?: number }) {
  const router = useRouter();
  const editing = Boolean(page?.id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const status = page?.status || 'draft';

  const [ctaUrl, setCtaUrl] = useState(page?.ctaUrl || '');
  const [disclosure, setDisclosure] = useState(page?.disclosureText || '');
  const [relatedProduct, setRelatedProduct] = useState(String(page?.relatedProduct ?? ''));
  const [relatedRequest, setRelatedRequest] = useState(String(page?.relatedRequest ?? ''));

  function prefillFrom(opts: Opt[], selectedId: string) {
    const o = opts.find((x) => String(x.id) === selectedId);
    if (o?.url && isSafeHttpUrl(o.url)) { setCtaUrl(o.url); setMsg('CTA URL prefilled — review and save.'); }
    else setErr('That item has no safe (http/https) link to prefill.');
  }

  function collect(form: HTMLFormElement) {
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '');
    let sections: Section[] = [];
    try { sections = JSON.parse(get('sectionsJson') || '[]'); } catch { sections = []; }
    return {
      title: get('title'), slug: get('slug'), pageType: get('pageType'),
      headline: get('headline'), subheadline: get('subheadline'), body: get('body'),
      ctaLabel: get('ctaLabel'), ctaUrl, disclosureText: disclosure,
      seoTitle: get('seoTitle'), seoDescription: get('seoDescription'),
      noindex: fd.get('noindex') === 'on',
      relatedProduct: relatedProduct || null, relatedRequest: relatedRequest || null,
      sections,
    };
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const data = collect(e.currentTarget);
    if (data.ctaUrl && !isSafeHttpUrl(data.ctaUrl)) { setErr('CTA URL must start with http:// or https://.'); setBusy(false); return; }
    try {
      if (editing) {
        const r = await fetch(`/api/app/landing-pages/${page!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not save.'); else { setMsg('Saved.'); router.refresh(); }
      } else {
        const r = await fetch('/api/app/landing-pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not create.'); else { router.push(`/app/landing-pages/${j.id}`); return; }
      }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function act(action: string) {
    if (action === 'publish' && !confirm('Publish this landing page? It will become publicly visible.')) return;
    if (action === 'archive' && !confirm('Archive this landing page? It will no longer be public.')) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/landing-pages/${page!.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not update status.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function del() {
    if (!confirm('Delete this landing page? This cannot be undone.')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/landing-pages/${page!.id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not delete.'); setBusy(false); } else router.push('/app/landing-pages');
    } catch { setErr('Network error.'); setBusy(false); }
  }

  const publicUrl = editing && page?.slug && workspaceSlug ? `/lp/${workspaceSlug}/${page.slug}` : '';
  const accent = brand?.accentColor && /^#?[0-9a-fA-F]{3,8}$/.test(brand.accentColor) ? brand.accentColor : '';

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      {editing ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-row">
            <span className="t">Status <span className={`adm-badge ${lpStatusVariant(status)}`}>{LP_STATUS_LABELS[status] || status}</span> · <strong>{views}</strong> view{views === 1 ? '' : 's'}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {status !== 'ready_for_review' && status !== 'published' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('ready')}>Mark ready</button> : null}
              {status !== 'published' ? <button className="adm-btn" disabled={busy} onClick={() => act('publish')}>Publish</button> : null}
              {status === 'published' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('unpublish')}>Unpublish</button> : null}
              {status !== 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('archive')}>Archive</button> : null}
              {status === 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Restore</button> : null}
            </span>
          </div>
          {status === 'published' && publicUrl ? <p className="adm-note" style={{ marginTop: 8 }}>Public: <a href={publicUrl} target="_blank" rel="noreferrer noopener">{publicUrl}</a></p>
            : <p className="adm-note" style={{ marginTop: 8 }}>Not public yet — only published pages appear at <code>/lp/{workspaceSlug || '…'}/{page?.slug || '…'}</code>.</p>}
        </div>
      ) : null}

      {brand ? (
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Brand Kit context:</strong>{brand.publicationName ? ` ${brand.publicationName} ·` : ''}{brand.brandVoice ? ` voice: ${brand.brandVoice.slice(0, 120)}` : ' set your voice in Brand Kit'}{accent ? <> · accent <span style={{ display: 'inline-block', width: 12, height: 12, background: accent, borderRadius: 3, verticalAlign: 'middle' }} /></> : null}
        </div>
      ) : <div className="adm-panel" style={{ marginBottom: 16 }}>No Brand Kit yet — set one up at <a href="/app/brand">Brand Kit</a> to power your pages.</div>}

      <form className="form" onSubmit={submit}>
        <div className="field"><label htmlFor="title">Title <span className="req">*</span></label><input id="title" name="title" required defaultValue={page?.title || ''} maxLength={200} /></div>
        {editing ? <div className="field"><label htmlFor="slug">Slug</label><input id="slug" name="slug" defaultValue={page?.slug || ''} maxLength={80} /></div> : null}
        <div className="field"><label htmlFor="pageType">Purpose</label>
          <select id="pageType" name="pageType" className="adm-select" defaultValue={page?.pageType || 'general'}>
            {Object.entries(LP_PAGE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="adm-cols-2">
          <div className="field"><label htmlFor="relatedProduct">Related product</label>
            {products.length ? (
              <span style={{ display: 'flex', gap: 6 }}>
                <select id="relatedProduct" className="adm-select" value={relatedProduct} onChange={(e) => setRelatedProduct(e.target.value)}>
                  <option value="">— none —</option>
                  {products.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={() => prefillFrom(products, relatedProduct)} disabled={!relatedProduct}>Use link → CTA</button>
              </span>
            ) : <p className="adm-note">No offers yet. <a href="/app/products">Add an offer</a>.</p>}
          </div>
          <div className="field"><label htmlFor="relatedRequest">Related request</label>
            {requests.length ? (
              <span style={{ display: 'flex', gap: 6 }}>
                <select id="relatedRequest" className="adm-select" value={relatedRequest} onChange={(e) => setRelatedRequest(e.target.value)}>
                  <option value="">— none —</option>
                  {requests.map((r) => <option key={r.id} value={String(r.id)}>{r.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={() => prefillFrom(requests, relatedRequest)} disabled={!relatedRequest}>Use link → CTA</button>
              </span>
            ) : <p className="adm-note">No submissions yet. <a href="/app/product-requests">Intake an offer</a>.</p>}
          </div>
        </div>

        <div className="field"><label htmlFor="headline">Headline</label><input id="headline" name="headline" defaultValue={page?.headline || ''} maxLength={300} /></div>
        <div className="field"><label htmlFor="subheadline">Subheadline</label><input id="subheadline" name="subheadline" defaultValue={page?.subheadline || ''} maxLength={500} /></div>

        <div className="field"><label>Structured sections (manual — nothing is generated)</label>
          <SectionsEditor initial={page?.sections || []} />
        </div>

        <div className="field"><label htmlFor="body">Fallback body (used when there are no sections — paragraphs separated by a blank line)</label><textarea id="body" name="body" rows={4} defaultValue={page?.body || ''} maxLength={20000} /></div>
        <div className="field"><label htmlFor="ctaLabel">CTA label</label><input id="ctaLabel" name="ctaLabel" defaultValue={page?.ctaLabel || ''} maxLength={120} placeholder="Shop now" /></div>
        <div className="field"><label htmlFor="ctaUrl">CTA URL (http/https only)</label><input id="ctaUrl" name="ctaUrl" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={500} placeholder="https://…" /></div>
        <div className="field"><label htmlFor="disclosureText">Disclosure / affiliate note {brand?.affiliateDisclosure ? <button type="button" className="adm-btn ghost" style={{ marginLeft: 6 }} onClick={() => setDisclosure(brand.affiliateDisclosure || '')}>Use brand disclosure</button> : null}</label><textarea id="disclosureText" name="disclosureText" rows={2} value={disclosure} onChange={(e) => setDisclosure(e.target.value)} maxLength={2000} /></div>
        <div className="field"><label htmlFor="seoTitle">SEO title</label><input id="seoTitle" name="seoTitle" defaultValue={page?.seoTitle || ''} maxLength={200} /></div>
        <div className="field"><label htmlFor="seoDescription">SEO description</label><textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={page?.seoDescription || ''} maxLength={500} /></div>
        {editing ? <div className="field"><label><input type="checkbox" name="noindex" defaultChecked={page?.noindex !== false} /> Keep this page out of search engines (noindex)</label></div> : null}
        <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}</button>
        {editing ? <button className="adm-btn ghost" type="button" disabled={busy} onClick={del} style={{ marginLeft: 8 }}>Delete</button> : null}
      </form>
    </>
  );
}
