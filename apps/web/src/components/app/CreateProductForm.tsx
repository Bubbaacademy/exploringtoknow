'use client';
import { useMemo, useRef, useState } from 'react';

type Category = { id: string | number; name: string; slug?: string };
type Up = { id: number; url: string; name: string };

const MIN = 1; const MAX = 30;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const OTHER_SLUG = 'other-not-sure';
const SUBMIT_TIMEOUT_MS = 20000;

/**
 * Workspace product / article-request creation. Uploads images to the
 * session-scoped /api/app/upload and submits to /api/app/product-requests.
 * No requester fields — the workspace owner is derived from the session.
 */
export function CreateProductForm({ categories, submitLabel = 'Submit for editorial review' }: { categories: Category[]; submitLabel?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<Up[]>([]);
  const [uploading, setUploading] = useState(false);
  const [permission, setPermission] = useState(false);
  const [catId, setCatId] = useState('');
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggested, setSuggested] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => categories.find((c) => String(c.id) === catId) || null, [categories, catId]);
  const isOther = selected?.slug === OTHER_SLUG;
  const filtered = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return (q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories).slice(0, 60);
  }, [categories, catQuery]);

  function pickCategory(c: Category) {
    setCatId(String(c.id)); setCatQuery(c.name); setCatOpen(false); setActiveIdx(-1);
    if (c.slug !== OTHER_SLUG) setSuggested('');
  }
  function onCatKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!catOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setCatOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { if (catOpen && activeIdx >= 0 && filtered[activeIdx]) { e.preventDefault(); pickCategory(filtered[activeIdx]); } }
    else if (e.key === 'Escape') { setCatOpen(false); setActiveIdx(-1); }
  }

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setMessage('');
    const room = MAX - images.length;
    setUploading(true);
    for (const f of Array.from(files).slice(0, room)) {
      if (!ACCEPT.includes(f.type)) { setMessage(`Skipped ${f.name}: only JPEG, PNG, WebP allowed.`); continue; }
      const fd = new FormData(); fd.append('file', f);
      try {
        const res = await fetch('/api/app/upload', { method: 'POST', body: fd });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.ok) setImages((prev) => (prev.some((p) => p.id === j.id) ? prev : [...prev, { id: j.id, url: j.url, name: f.name }]));
        else setMessage(j.error || `Upload failed for ${f.name}.`);
      } catch { setMessage(`Upload failed for ${f.name}.`); }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }
  function removeImage(id: number) { setImages((prev) => prev.filter((i) => i.id !== id)); }
  function fail(msg: string) { setState('err'); setMessage(msg); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return; // anti double-submit
    if (!catId) return fail('Please select a product category from the list.');
    if (isOther && suggested.trim().length < 2) return fail('Please describe your suggested category.');
    if (images.length < MIN) return fail(`Please upload at least ${MIN} image.`);
    if (!permission) return fail('Please confirm you have permission to use these images.');

    setState('sending'); setMessage('');
    const form = e.currentTarget;
    const data: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    data.requestedCategory = catId;
    data.suggestedCategory = isOther ? suggested.trim() : '';
    data.imageIds = images.map((i) => i.id);
    data.imagePermissionConfirmed = permission;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SUBMIT_TIMEOUT_MS);
    try {
      const res = await fetch('/api/app/product-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: ctrl.signal,
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setState('ok'); window.location.href = j.redirect || '/app/product-requests'; }
      else fail(j.error || 'Something went wrong. Please review the form and try again.');
    } catch (err) {
      fail((err as { name?: string })?.name === 'AbortError' ? 'The request timed out. Your details are kept — please try again.' : 'Network error. Your details are kept — please try again.');
    } finally { clearTimeout(timer); }
  }

  const needMore = Math.max(0, MIN - images.length);
  const canSubmit = state !== 'sending' && !uploading && !!catId && (!isOther || suggested.trim().length >= 2) && images.length >= MIN && permission;

  if (state === 'ok') {
    return <div className="adm-panel ok" role="status"><strong>Submitted.</strong> Taking you to your product requests…</div>;
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate style={{ maxWidth: 720 }}>
      <div aria-live="polite">{state === 'err' ? <div className="notice err" role="alert">{message}</div> : null}</div>
      <div className="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label></div>

      <fieldset className="form-section">
        <legend>Product</legend>
        <div className="field"><label htmlFor="productName">Product name <span className="req">*</span></label><input id="productName" name="productName" required maxLength={200} /></div>
        <div className="field"><label htmlFor="brand">Brand <span className="opt">(optional)</span></label><input id="brand" name="brand" maxLength={120} /></div>
        <div className="field"><label htmlFor="productUrl">Product URL <span className="req">*</span></label><input id="productUrl" name="productUrl" type="url" required placeholder="https://…" /><span className="hint">A link to the product page so editors can research it.</span></div>
        <div className="field"><label htmlFor="notes">Short description / notes <span className="opt">(optional)</span></label><textarea id="notes" name="notes" maxLength={2000} placeholder="What it is, who it’s for, what to highlight." /></div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Category</legend>
        <div className="field" style={{ position: 'relative' }}>
          <label htmlFor="categorySearch">Product category <span className="req">*</span></label>
          <input
            id="categorySearch" type="text" autoComplete="off" placeholder="Type to search categories…"
            value={catQuery}
            onChange={(e) => { setCatQuery(e.target.value); setCatId(''); setCatOpen(true); setActiveIdx(-1); }}
            onFocus={() => setCatOpen(true)} onBlur={() => setTimeout(() => setCatOpen(false), 150)}
            onKeyDown={onCatKeyDown} role="combobox" aria-expanded={catOpen} aria-controls="wsCatList" aria-autocomplete="list"
          />
          {catOpen ? (
            <ul id="wsCatList" className="combo-list" role="listbox">
              {filtered.length ? filtered.map((c, i) => (
                <li key={String(c.id)} role="option" aria-selected={String(c.id) === catId}>
                  <button type="button" className={`combo-opt ${i === activeIdx ? 'active' : ''}`} onMouseEnter={() => setActiveIdx(i)} onMouseDown={(ev) => { ev.preventDefault(); pickCategory(c); }}>{c.name}</button>
                </li>
              )) : <li className="combo-empty">No matching category</li>}
            </ul>
          ) : null}
          {catId ? <span className="hint ok-hint">Selected: {selected?.name}</span> : <span className="hint">Choose the closest fit — an editor confirms it before publishing.</span>}
        </div>
        {isOther ? (
          <div className="field">
            <label htmlFor="suggestedCategory">Suggested category <span className="req">*</span></label>
            <input id="suggestedCategory" type="text" maxLength={120} value={suggested} onChange={(e) => setSuggested(e.target.value)} placeholder="Tell us what category fits best" />
          </div>
        ) : null}
      </fieldset>

      <fieldset className="form-section">
        <legend>Images</legend>
        <div className="field">
          <label>Upload images <span className="req">*</span></label>
          <div className={`uploader ${images.length >= MAX ? 'is-full' : ''}`}>
            <input ref={fileRef} id="wsImages" type="file" accept={ACCEPT.join(',')} multiple onChange={(e) => onFiles(e.target.files)} disabled={uploading || images.length >= MAX} />
            <div className="uploader-meta">
              <strong>{images.length} of {MAX} uploaded</strong>
              {uploading ? <span className="meta"> · Uploading…</span> : needMore > 0 ? <span className="meta"> · {needMore} more needed (min {MIN})</span> : <span className="meta ok-hint"> · minimum reached ✓</span>}
            </div>
          </div>
          {images.length ? (
            <div className="img-grid">
              {images.map((im) => (
                <div key={im.id} className="img-tile">
                  <img src={im.url} alt={im.name} loading="lazy" />
                  <button type="button" className="img-x" onClick={() => removeImage(im.id)} aria-label={`Remove ${im.name}`}>×</button>
                </div>
              ))}
            </div>
          ) : null}
          <span className="hint">JPEG, PNG, or WebP, up to 8&nbsp;MB each. Your own permission-cleared photos only — no AI-generated images.</span>
        </div>
        <div className="field perm-field">
          <input id="wsPerm" type="checkbox" checked={permission} onChange={(e) => setPermission(e.target.checked)} />
          <label htmlFor="wsPerm">I confirm I have permission to use these images in editorial content. <span className="req">*</span></label>
        </div>
      </fieldset>

      <button className="adm-btn adm-btn-block" type="submit" disabled={!canSubmit} aria-busy={state === 'sending'} style={{ opacity: canSubmit ? 1 : 0.6 }}>
        {state === 'sending' ? 'Submitting…' : submitLabel}
      </button>
      <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>An editor reviews every submission before anything is generated or published. Nothing publishes automatically.</p>
    </form>
  );
}
