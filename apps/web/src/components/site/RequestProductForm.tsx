'use client';
import { useMemo, useRef, useState } from 'react';

type Category = { id: string | number; name: string; slug?: string };
type Up = { id: number; url: string; name: string };

const MIN = 3; const MAX = 30;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const OTHER_SLUG = 'other-not-sure';
const SUBMIT_TIMEOUT_MS = 20000;

export function RequestProductForm({ categories }: { categories: Category[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<Up[]>([]);
  const [uploading, setUploading] = useState(false);
  const [permission, setPermission] = useState(false);
  // Category combobox (searchable, required)
  const [catId, setCatId] = useState<string>('');
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [suggested, setSuggested] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => categories.find((c) => String(c.id) === catId) || null, [categories, catId]);
  const isOther = selected?.slug === OTHER_SLUG;
  const filtered = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    const list = q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
    return list.slice(0, 60);
  }, [categories, catQuery]);

  function pickCategory(c: Category) {
    setCatId(String(c.id));
    setCatQuery(c.name);
    setCatOpen(false);
    if (c.slug !== OTHER_SLUG) setSuggested('');
  }

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setMessage('');
    const room = MAX - images.length;
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    for (const f of list) {
      if (!ACCEPT.includes(f.type)) { setMessage(`Skipped ${f.name}: only JPEG, PNG, WebP allowed.`); continue; }
      const fd = new FormData(); fd.append('file', f);
      try {
        const res = await fetch('/api/product-request-upload', { method: 'POST', body: fd });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.ok) setImages((prev) => [...prev, { id: j.id, url: j.url, name: f.name }]);
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
    if (state === 'sending') return; // prevent double submission
    // Client-side validation (server re-validates everything).
    if (!catId) return fail('Please select a product category.');
    if (isOther && suggested.trim().length < 2) return fail('Please describe your suggested category.');
    if (images.length < MIN) return fail(`Please upload at least ${MIN} images (${images.length} so far).`);
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
      const res = await fetch('/api/product-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: ctrl.signal,
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState('ok');
        setMessage('Thanks! Your request and images were submitted and are awaiting editorial review.');
        // Only reset on success.
        form.reset(); setImages([]); setPermission(false);
        setCatId(''); setCatQuery(''); setSuggested('');
      } else {
        // Preserve all entered values; show the server's validation message.
        fail(j.error || 'Something went wrong. Please review the form and try again.');
      }
    } catch (err) {
      fail((err as any)?.name === 'AbortError'
        ? 'The request timed out. Your details are kept — please try again.'
        : 'Network error. Your details are kept — please try again.');
    } finally {
      clearTimeout(timer);
    }
  }

  const canSubmit = state !== 'sending' && !uploading && !!catId && (!isOther || suggested.trim().length >= 2) && images.length >= MIN && permission;

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {state === 'ok' ? <div className="notice ok">{message}</div> : null}
      {state === 'err' ? <div className="notice err">{message}</div> : null}

      <div className="hp" aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="field"><label htmlFor="requesterName">Your name <span className="req">*</span></label><input id="requesterName" name="requesterName" required maxLength={120} /></div>
      <div className="field"><label htmlFor="requesterEmail">Email <span className="req">*</span></label><input id="requesterEmail" name="requesterEmail" type="email" required maxLength={160} /></div>
      <div className="field"><label htmlFor="productName">Product name <span className="req">*</span></label><input id="productName" name="productName" required maxLength={200} /></div>
      <div className="field"><label htmlFor="brand">Brand</label><input id="brand" name="brand" maxLength={120} /></div>
      <div className="field"><label htmlFor="productUrl">Product URL <span className="req">*</span></label><input id="productUrl" name="productUrl" type="url" required placeholder="https://…" /></div>
      <div className="field"><label htmlFor="affiliateUrl">Affiliate URL (optional)</label><input id="affiliateUrl" name="affiliateUrl" type="url" placeholder="https://…" /></div>

      {/* Searchable, required category */}
      <div className="field" style={{ position: 'relative' }}>
        <label htmlFor="categorySearch">Product category <span className="req">*</span></label>
        <input
          id="categorySearch" type="text" autoComplete="off" placeholder="Select a product category"
          value={catQuery}
          onChange={(e) => { setCatQuery(e.target.value); setCatId(''); setCatOpen(true); }}
          onFocus={() => setCatOpen(true)}
          onBlur={() => setTimeout(() => setCatOpen(false), 150)}
          aria-expanded={catOpen} aria-required="true" role="combobox" aria-controls="categoryList"
        />
        {catOpen ? (
          <ul id="categoryList" className="combo-list" role="listbox">
            {filtered.length ? filtered.map((c) => (
              <li key={String(c.id)} role="option" aria-selected={String(c.id) === catId}>
                <button type="button" className="combo-opt" onMouseDown={(ev) => { ev.preventDefault(); pickCategory(c); }}>{c.name}</button>
              </li>
            )) : <li className="combo-empty">No matching category</li>}
          </ul>
        ) : null}
        {!catId && catQuery ? <span className="meta">Pick a category from the list.</span> : null}
      </div>

      {isOther ? (
        <div className="field">
          <label htmlFor="suggestedCategory">Suggested category <span className="req">*</span></label>
          <input id="suggestedCategory" type="text" maxLength={120} value={suggested} onChange={(e) => setSuggested(e.target.value)} placeholder="Tell us what category fits best" />
          <span className="meta">An editor will map this to a category before approval.</span>
        </div>
      ) : null}

      <div className="field"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" maxLength={2000} /></div>

      {/* Images */}
      <div className="field">
        <label>Product images <span className="req">*</span> <span className="meta">({images.length} of {MAX} uploaded · min {MIN})</span></label>
        <input ref={fileRef} type="file" accept={ACCEPT.join(',')} multiple onChange={(e) => onFiles(e.target.files)} disabled={uploading || images.length >= MAX} />
        {uploading ? <span className="meta">Uploading…</span> : null}
        {images.length ? (
          <div className="img-grid">
            {images.map((im) => (
              <div key={im.id} className="img-tile">
                <img src={im.url} alt={im.name} loading="lazy" />
                <button type="button" className="img-x" onClick={() => removeImage(im.id)} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        ) : null}
        <span className="meta">JPEG, PNG, or WebP, up to 8 MB each. Upload at least {MIN} (up to {MAX}).</span>
      </div>

      <div className="field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <input id="perm" type="checkbox" checked={permission} onChange={(e) => setPermission(e.target.checked)} style={{ marginTop: 4 }} />
        <label htmlFor="perm" style={{ fontWeight: 400 }}>I confirm I have permission to use the uploaded images. <span className="req">*</span></label>
      </div>

      <button className="btn btn-accent" type="submit" disabled={!canSubmit}>
        {state === 'sending' ? 'Submitting…' : 'Submit request'}
      </button>
      <p className="meta" style={{ marginTop: 12 }}>Submissions are reviewed by an editor before any article is created or published. We never auto-publish.</p>
    </form>
  );
}
