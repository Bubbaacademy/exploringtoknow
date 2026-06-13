'use client';
import { useRef, useState } from 'react';

type Category = { id: string | number; name: string };
type Up = { id: number; url: string; name: string };

const MIN = 3; const MAX = 30;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export function RequestProductForm({ categories }: { categories: Category[] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<Up[]>([]);
  const [uploading, setUploading] = useState(false);
  const [permission, setPermission] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (images.length < MIN) { setState('err'); setMessage(`Please upload at least ${MIN} images (${images.length} so far).`); return; }
    if (!permission) { setState('err'); setMessage('Please confirm you have permission to use these images.'); return; }
    setState('sending'); setMessage('');
    const form = e.currentTarget;
    const data: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    data.imageIds = images.map((i) => i.id);
    data.imagePermissionConfirmed = permission;
    try {
      const res = await fetch('/api/product-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setState('ok'); setMessage('Thanks! Your request and images were submitted and are awaiting editorial review.');
        form.reset(); setImages([]); setPermission(false);
      } else { setState('err'); setMessage(j.error || 'Something went wrong.'); }
    } catch { setState('err'); setMessage('Network error. Please try again.'); }
  }

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
      <div className="field">
        <label htmlFor="requestedCategory">Category</label>
        <select id="requestedCategory" name="requestedCategory" defaultValue="">
          <option value="">— Select —</option>
          {categories.map((c) => <option key={String(c.id)} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>
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

      <button className="btn btn-accent" type="submit" disabled={state === 'sending' || uploading || images.length < MIN || !permission}>
        {state === 'sending' ? 'Submitting…' : 'Submit request'}
      </button>
      <p className="meta" style={{ marginTop: 12 }}>Submissions are reviewed by an editor before any article is created or published. We never auto-publish.</p>
    </form>
  );
}
