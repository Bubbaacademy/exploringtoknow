'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERF_CSV_COLUMNS } from '@/lib/performance-constants';

const SAMPLE = `date,platform,channel,campaign,ad_set,creative,impressions,clicks,spend,conversions,revenue,leads,landing_page_slug,notes
2026-06-01,meta,ad,Spring Sale,Lookalike 1%,Hook A,12000,340,85.50,12,540,0,spring-deals,strong CTR
2026-06-02,google_search,ad,Brand,Exact,Headline B,8000,210,60,9,420,3,,`;

export function PerformanceImport() {
  const router = useRouter();
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [prev, setPrev] = useState<{ acceptedCount: number; rejectedCount: number; errors: Array<{ row: number; reason: string }> } | null>(null);

  async function call(preview: boolean) {
    if (!csv.trim()) { setErr('Paste some CSV first.'); return; }
    setBusy(true); setErr(''); setMsg(''); if (preview) setPrev(null);
    try {
      const r = await fetch('/api/app/performance/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv, preview }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not process the CSV.'); if (j.errors) setPrev({ acceptedCount: 0, rejectedCount: j.rejectedCount || 0, errors: j.errors }); }
      else if (preview) { setPrev({ acceptedCount: j.acceptedCount, rejectedCount: j.rejectedCount, errors: j.errors || [] }); setMsg(`Preview: ${j.acceptedCount} row(s) ready, ${j.rejectedCount} skipped.`); }
      else { setMsg(`Imported ${j.created} row(s)${j.rejectedCount ? `, skipped ${j.rejectedCount}` : ''}.`); router.push('/app/performance'); }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      <div className="adm-panel" style={{ marginBottom: 12 }}>
        Paste CSV text (no file upload, no platform sync). Expected columns:&nbsp;
        <code>{PERF_CSV_COLUMNS.join(', ')}</code>. Unknown columns are ignored; a header row is required. Dates must be <code>YYYY-MM-DD</code>.
        <button type="button" className="adm-btn ghost" style={{ marginLeft: 8 }} onClick={() => setCsv(SAMPLE)}>Load sample</button>
      </div>

      <div className="field"><label htmlFor="csv">CSV</label>
        <textarea id="csv" rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="date,platform,channel,campaign,…" style={{ fontFamily: 'monospace', fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="adm-btn ghost" disabled={busy} onClick={() => call(true)}>Preview</button>
        <button type="button" className="adm-btn" disabled={busy} onClick={() => call(false)}>Import</button>
      </div>

      {prev ? (
        <div className="adm-card" style={{ marginTop: 16 }}>
          <div className="adm-row"><span className="t">Preview</span><span><strong>{prev.acceptedCount}</strong> ready · <strong>{prev.rejectedCount}</strong> skipped</span></div>
          {prev.errors.length ? (
            <div style={{ marginTop: 8 }}>
              <p className="adm-note">Skipped rows:</p>
              <ul className="adm-note" style={{ margin: '4px 0 0 16px' }}>{prev.errors.map((e, i) => <li key={i}>Row {e.row}: {e.reason}</li>)}</ul>
            </div>
          ) : <p className="adm-note" style={{ marginTop: 8 }}>All rows valid.</p>}
        </div>
      ) : null}
    </>
  );
}
