'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = { id: string | number; name: string; channel: string; plannedDate: string; campaignLabel: string };

export function SocialExportPanel({ posts }: { posts: Item[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [markExported, setMarkExported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [out, setOut] = useState<{ text: string; csv: string; count: number } | null>(null);

  const ids = posts.filter((p) => sel[String(p.id)]).map((p) => p.id);
  const allOn = posts.length > 0 && ids.length === posts.length;
  const toggleAll = () => setSel(allOn ? {} : Object.fromEntries(posts.map((p) => [String(p.id), true])));

  async function runExport() {
    if (!ids.length) { setErr('Select at least one post.'); return; }
    setBusy(true); setErr(''); setMsg(''); setOut(null);
    try {
      const r = await fetch('/api/app/social-posts/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, markExported }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not export.'); }
      else {
        setOut({ text: j.text || '', csv: j.csv || '', count: j.count || 0 });
        setMsg(`Exported ${j.count} post${j.count === 1 ? '' : 's'} below.${markExported ? ' Marked as exported.' : ''}`);
        if (markExported) router.refresh();
      }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function copyText() {
    if (!out?.text) return;
    try { if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(out.text); setMsg('Copied to clipboard.'); } else setMsg('Select the text and copy it.'); }
    catch { setMsg('Select the text and copy it.'); }
  }

  function downloadCsv() {
    if (!out?.csv) return;
    try {
      const blob = new Blob([out.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'social-posts-export.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { setErr('Could not build the CSV download. Copy the text instead.'); }
  }

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      <div className="adm-card" style={{ marginBottom: 16 }}>
        <div className="adm-row" style={{ marginBottom: 8 }}>
          <span className="t">Approved posts ({posts.length})</span>
          <button type="button" className="adm-btn ghost" onClick={toggleAll}>{allOn ? 'Clear all' : 'Select all'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {posts.map((p) => (
            <label key={String(p.id)} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!sel[String(p.id)]} onChange={(e) => setSel((s) => ({ ...s, [String(p.id)]: e.target.checked }))} />
              <span className="adm-badge">{p.channel}</span>
              <strong>{p.name}</strong>
              {p.plannedDate ? <span className="adm-note">📅 {p.plannedDate}</span> : null}
              {p.campaignLabel ? <span className="adm-note">#{p.campaignLabel}</span> : null}
            </label>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn" disabled={busy || !ids.length} onClick={runExport}>{busy ? 'Exporting…' : `Export selected (${ids.length})`}</button>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={markExported} onChange={(e) => setMarkExported(e.target.checked)} /> Mark as exported (records a copy count; no posting)
          </label>
        </div>
      </div>

      {out ? (
        <div className="adm-card">
          <div className="adm-row" style={{ marginBottom: 8 }}>
            <span className="t">Export output — {out.count} post{out.count === 1 ? '' : 's'} (grouped by channel)</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="adm-btn" onClick={copyText}>Copy text</button>
              <button type="button" className="adm-btn ghost" onClick={downloadCsv}>Download CSV</button>
            </span>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--adm-bg, #faf8f4)', border: '1px solid var(--adm-line, #e5e0d6)', borderRadius: 8, padding: 12, fontFamily: 'inherit', fontSize: 14, maxHeight: 480, overflow: 'auto' }}>{out.text || '(empty)'}</pre>
        </div>
      ) : null}
    </>
  );
}
