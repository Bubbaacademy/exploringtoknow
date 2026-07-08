'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SS_CHANNEL_LABELS, SS_FORMAT_LABELS, SS_STATUS_LABELS, SS_CHANNEL_HELP, SS_CHANNELS, SS_PRIORITY_LABELS,
  ssStatusVariant, isSafeHttpUrl, hashtagsToString, normalizeHashtags, composeSocialText,
} from '@/lib/social-constants';

type Opt = { id: string | number; label: string; url: string };
type Member = { id: string | number; label: string };
type Brand = { publicationName?: string; brandVoice?: string; targetAudience?: string; accentColor?: string; affiliateDisclosure?: string };
type Post = {
  id?: string | number; name?: string; channel?: string; format?: string; status?: string;
  hook?: string; caption?: string; hashtags?: string[]; ctaLabel?: string; ctaUrl?: string;
  disclosureText?: string; platformNotes?: string; notes?: string;
  relatedProduct?: string | number | null; relatedRequest?: string | number | null;
  relatedLandingPage?: string | number | null; copyCount?: number;
  plannedDate?: string; campaignLabel?: string; contentPillar?: string; priority?: string;
  assignee?: string | number | null; calendarNotes?: string; duplicatedFrom?: string | number | null;
};

export function SocialPostEditor({ post, products = [], requests = [], landingPages = [], assignees = [], brand, brandProfileId }:
  { post?: Post; products?: Opt[]; requests?: Opt[]; landingPages?: Opt[]; assignees?: Member[]; brand?: Brand | null; brandProfileId?: string | number | null }) {
  const router = useRouter();
  const editing = Boolean(post?.id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const status = post?.status || 'draft';

  const [channel, setChannel] = useState(post?.channel || 'generic');
  const [hook, setHook] = useState(post?.hook || '');
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(hashtagsToString(post?.hashtags));
  const [ctaLabel, setCtaLabel] = useState(post?.ctaLabel || '');
  const [ctaUrl, setCtaUrl] = useState(post?.ctaUrl || '');
  const [disclosure, setDisclosure] = useState(post?.disclosureText || '');
  const [relatedProduct, setRelatedProduct] = useState(String(post?.relatedProduct ?? ''));
  const [relatedRequest, setRelatedRequest] = useState(String(post?.relatedRequest ?? ''));
  const [relatedLandingPage, setRelatedLandingPage] = useState(String(post?.relatedLandingPage ?? ''));
  const [dupChannels, setDupChannels] = useState<Record<string, boolean>>({});

  const composed = useMemo(
    () => composeSocialText({ hook, caption, ctaLabel, ctaUrl, hashtags: normalizeHashtags(hashtags), disclosureText: disclosure }),
    [hook, caption, ctaLabel, ctaUrl, hashtags, disclosure],
  );

  function prefillFrom(opts: Opt[], selectedId: string) {
    const o = opts.find((x) => String(x.id) === selectedId);
    if (o?.url && isSafeHttpUrl(o.url)) { setCtaUrl(o.url); setMsg('CTA URL prefilled — review and save.'); setErr(''); }
    else setErr('That item has no safe (http/https) link to prefill.');
  }

  function collect(form: HTMLFormElement) {
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '');
    return {
      name: get('name'), channel, format: get('format'),
      hook, caption, hashtags: normalizeHashtags(hashtags),
      ctaLabel, ctaUrl, disclosureText: disclosure,
      platformNotes: get('platformNotes'), notes: get('notes'),
      plannedDate: get('plannedDate'), campaignLabel: get('campaignLabel'), contentPillar: get('contentPillar'),
      priority: get('priority'), assignee: get('assignee') || null, calendarNotes: get('calendarNotes'),
      relatedProduct: relatedProduct || null, relatedRequest: relatedRequest || null,
      relatedLandingPage: relatedLandingPage || null,
      relatedBrandProfile: brandProfileId ?? null,
    };
  }

  async function duplicate() {
    const channels = Object.keys(dupChannels).filter((c) => dupChannels[c]);
    if (!channels.length) { setErr('Pick at least one channel to duplicate into.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/social-posts/${post!.id}/duplicate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channels }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not duplicate.');
      else { setMsg(`Created ${j.created?.length || 0} draft${(j.created?.length || 0) === 1 ? '' : 's'}. Find them in your list.`); setDupChannels({}); router.refresh(); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const data = collect(e.currentTarget);
    if (data.ctaUrl && !isSafeHttpUrl(data.ctaUrl)) { setErr('CTA URL must start with http:// or https://.'); setBusy(false); return; }
    try {
      if (editing) {
        const r = await fetch(`/api/app/social-posts/${post!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not save.'); else { setMsg('Saved.'); router.refresh(); }
      } else {
        const r = await fetch('/api/app/social-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not create.'); else { router.push(`/app/social-posts/${j.id}`); return; }
      }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function act(action: string) {
    if (action === 'archive' && !confirm('Archive this social post?')) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/social-posts/${post!.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not update status.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function del() {
    if (!confirm('Delete this social post? This cannot be undone.')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/social-posts/${post!.id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not delete.'); setBusy(false); } else router.push('/app/social-posts');
    } catch { setErr('Network error.'); setBusy(false); }
  }

  async function copyText() {
    setErr(''); setMsg('');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(composed);
        setMsg('Copied to clipboard.');
      } else {
        setMsg('Select the text below and copy it.');
      }
      // Record the copy (first-party counter) — only meaningful once approved.
      if (editing && status === 'approved_to_copy') {
        await fetch(`/api/app/social-posts/${post!.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'copied' }) }).catch(() => {});
        router.refresh();
      }
    } catch { setMsg('Select the text below and copy it.'); }
  }

  const accent = brand?.accentColor && /^#?[0-9a-fA-F]{3,8}$/.test(brand.accentColor) ? brand.accentColor : '';

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      {editing ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-row">
            <span className="t">Status <span className={`adm-badge ${ssStatusVariant(status)}`}>{SS_STATUS_LABELS[status] || status}</span>{post?.copyCount ? <> · copied <strong>{post.copyCount}</strong>×</> : null}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {status !== 'ready_for_review' && status !== 'approved_to_copy' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('ready')}>Mark ready</button> : null}
              {status !== 'approved_to_copy' ? <button className="adm-btn" disabled={busy} onClick={() => act('approve')}>Approve to copy</button> : null}
              {status === 'approved_to_copy' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Back to draft</button> : null}
              {status !== 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('archive')}>Archive</button> : null}
              {status === 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Restore</button> : null}
            </span>
          </div>
          <p className="adm-note" style={{ marginTop: 8 }}>Manual authoring only — nothing is generated, scheduled, or posted to any network. “Approve to copy” just unlocks the copy-to-clipboard export.</p>
          {post?.duplicatedFrom ? <p className="adm-note">Duplicated from another post in this workspace.</p> : null}
        </div>
      ) : null}

      {editing ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-row" style={{ marginBottom: 8 }}><span className="t">Duplicate to other channels</span></div>
          <p className="adm-note" style={{ marginBottom: 8 }}>Creates new <strong>drafts</strong> (copy is not rewritten or generated) you can adapt per channel. Nothing is posted.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            {SS_CHANNELS.map((c) => (
              <label key={c} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="checkbox" checked={!!dupChannels[c]} onChange={(e) => setDupChannels((s) => ({ ...s, [c]: e.target.checked }))} /> {SS_CHANNEL_LABELS[c]}
              </label>
            ))}
          </div>
          <button type="button" className="adm-btn ghost" disabled={busy} onClick={duplicate}>Duplicate to selected channels</button>
        </div>
      ) : null}

      {brand ? (
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          <strong>Brand Kit context:</strong>{brand.publicationName ? ` ${brand.publicationName} ·` : ''}{brand.brandVoice ? ` voice: ${brand.brandVoice.slice(0, 100)}` : ' set your voice in Brand Kit'}{brand.targetAudience ? ` · audience: ${brand.targetAudience.slice(0, 80)}` : ''}{accent ? <> · accent <span style={{ display: 'inline-block', width: 12, height: 12, background: accent, borderRadius: 3, verticalAlign: 'middle' }} /></> : null}
        </div>
      ) : <div className="adm-panel" style={{ marginBottom: 16 }}>No Brand Kit yet — set one up at <a href="/app/brand">Brand Kit</a> to keep your social voice consistent.</div>}

      <div className="adm-cols-2" style={{ alignItems: 'start', gap: 16 }}>
        <form className="form" onSubmit={submit}>
          <div className="field"><label htmlFor="name">Internal name <span className="req">*</span></label><input id="name" name="name" required defaultValue={post?.name || ''} maxLength={200} placeholder="e.g. Spring sleep-kit teaser — IG" /></div>

          <div className="adm-cols-2">
            <div className="field"><label htmlFor="channel">Channel</label>
              <select id="channel" name="channel" className="adm-select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {Object.entries(SS_CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="format">Format</label>
              <select id="format" name="format" className="adm-select" defaultValue={post?.format || 'text'}>
                {Object.entries(SS_FORMAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <p className="adm-note" style={{ marginTop: -4 }}>{SS_CHANNEL_HELP[channel]}</p>

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

          <div className="field"><label htmlFor="relatedLandingPage">Related landing page</label>
            {landingPages.length ? (
              <span style={{ display: 'flex', gap: 6 }}>
                <select id="relatedLandingPage" className="adm-select" value={relatedLandingPage} onChange={(e) => setRelatedLandingPage(e.target.value)}>
                  <option value="">— none —</option>
                  {landingPages.map((p) => <option key={p.id} value={String(p.id)}>{p.label}</option>)}
                </select>
                <button type="button" className="adm-btn ghost" onClick={() => prefillFrom(landingPages, relatedLandingPage)} disabled={!relatedLandingPage}>Use public URL → CTA</button>
              </span>
            ) : <p className="adm-note">No landing pages yet. <a href="/app/landing-pages">Create one</a>. Only published pages have a public URL to link.</p>}
          </div>

          <div className="field"><label htmlFor="hook">Hook (first line)</label><textarea id="hook" rows={2} value={hook} onChange={(e) => setHook(e.target.value)} maxLength={1000} placeholder="Stop scrolling if your sleep is wrecked by bright LEDs…" /></div>
          <div className="field"><label htmlFor="caption">Caption / body</label><textarea id="caption" rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={8000} placeholder="Write the post copy. Nothing is generated for you." /></div>
          <div className="field"><label htmlFor="hashtags">Hashtags (space or comma separated — the # is optional)</label><input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} maxLength={1500} placeholder="sleep wellness bedtime" /></div>

          <div className="adm-cols-2">
            <div className="field"><label htmlFor="ctaLabel">CTA label</label><input id="ctaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={120} placeholder="Read the guide" /></div>
            <div className="field"><label htmlFor="ctaUrl">CTA URL (http/https only)</label><input id="ctaUrl" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={500} placeholder="https://…" /></div>
          </div>

          <div className="field"><label htmlFor="disclosureText">Disclosure / affiliate note {brand?.affiliateDisclosure ? <button type="button" className="adm-btn ghost" style={{ marginLeft: 6 }} onClick={() => setDisclosure(brand.affiliateDisclosure || '')}>Use brand disclosure</button> : null}</label><textarea id="disclosureText" rows={2} value={disclosure} onChange={(e) => setDisclosure(e.target.value)} maxLength={2000} placeholder="#ad / affiliate disclosure if this CTA earns a commission." /></div>

          <div className="field"><label htmlFor="platformNotes">Platform notes / constraints (manual)</label><textarea id="platformNotes" name="platformNotes" rows={2} defaultValue={post?.platformNotes || ''} maxLength={2000} placeholder="e.g. needs a 9:16 cover; link goes in bio, not caption." /></div>
          <div className="field"><label htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" rows={2} defaultValue={post?.notes || ''} maxLength={4000} /></div>

          <div className="adm-panel" style={{ marginBottom: 12 }}><strong>Planning</strong> — manual only. A planned date places the post on the calendar; nothing is scheduled to run.</div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="plannedDate">Planned date</label><input id="plannedDate" name="plannedDate" type="date" defaultValue={post?.plannedDate || ''} /></div>
            <div className="field"><label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" className="adm-select" defaultValue={post?.priority || 'normal'}>
                {Object.entries(SS_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="campaignLabel">Campaign</label><input id="campaignLabel" name="campaignLabel" defaultValue={post?.campaignLabel || ''} maxLength={200} placeholder="Spring launch" /></div>
            <div className="field"><label htmlFor="contentPillar">Content pillar</label><input id="contentPillar" name="contentPillar" defaultValue={post?.contentPillar || ''} maxLength={200} placeholder="Education / Product / Social proof" /></div>
          </div>
          <div className="field"><label htmlFor="assignee">Assignee</label>
            <select id="assignee" name="assignee" className="adm-select" defaultValue={String(post?.assignee ?? '')}>
              <option value="">— unassigned —</option>
              {assignees.map((m) => <option key={m.id} value={String(m.id)}>{m.label}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="calendarNotes">Planning notes</label><textarea id="calendarNotes" name="calendarNotes" rows={2} defaultValue={post?.calendarNotes || ''} maxLength={2000} /></div>

          <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}</button>
          {editing ? <button className="adm-btn ghost" type="button" disabled={busy} onClick={del} style={{ marginLeft: 8 }}>Delete</button> : null}
        </form>

        <div className="adm-card" style={{ position: 'sticky', top: 12 }}>
          <div className="adm-row"><span className="t">Preview &amp; copy</span><span className="adm-badge">{SS_CHANNEL_LABELS[channel] || channel}</span></div>
          <p className="adm-note" style={{ marginTop: 8 }}>This is exactly the text you’ll copy — assembled from the fields. Nothing is posted anywhere.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--adm-bg, #faf8f4)', border: '1px solid var(--adm-line, #e5e0d6)', borderRadius: 8, padding: 12, marginTop: 8, fontFamily: 'inherit', fontSize: 14 }}>{composed || 'Your composed post will appear here as you type.'}</pre>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="adm-btn" disabled={!composed} onClick={copyText}>Copy text</button>
            {editing && status !== 'approved_to_copy' ? <span className="adm-note">Approve to copy to track exports.</span> : null}
          </div>
        </div>
      </div>
    </>
  );
}
