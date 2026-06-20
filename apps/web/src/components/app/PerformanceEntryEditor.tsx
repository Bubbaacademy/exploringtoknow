'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PERF_PLATFORM_LABELS, PERF_CHANNEL_LABELS, PERF_STATUS_LABELS, perfStatusVariant,
  computeMetrics, fmtPct, fmtMoney, fmtX,
} from '@/lib/performance-constants';

type Opt = { id: string | number; label: string };
type Pickers = { adCampaigns?: Opt[]; adCreatives?: Opt[]; landingPages?: Opt[]; socialPosts?: Opt[]; products?: Opt[]; requests?: Opt[]; articles?: Opt[] };
type Entry = {
  id?: string | number; platform?: string; channelType?: string; status?: string; entryDate?: string; entryDateEnd?: string;
  campaignName?: string; adSetName?: string; creativeName?: string; currency?: string; notes?: string;
  impressions?: number; clicks?: number; spend?: number; conversions?: number; orders?: number; revenue?: number; leads?: number; addToCart?: number;
  relatedAdCampaign?: string | number | null; relatedAdCreative?: string | number | null; relatedLandingPage?: string | number | null;
  relatedSocialPost?: string | number | null; relatedProduct?: string | number | null; relatedRequest?: string | number | null; relatedArticle?: string | number | null;
};

const REL: Array<[keyof Pickers, string, string]> = [
  ['adCampaigns', 'relatedAdCampaign', 'Ad campaign'], ['adCreatives', 'relatedAdCreative', 'Ad creative'],
  ['landingPages', 'relatedLandingPage', 'Landing page'], ['socialPosts', 'relatedSocialPost', 'Social post'],
  ['products', 'relatedProduct', 'Product'], ['requests', 'relatedRequest', 'Request'], ['articles', 'relatedArticle', 'Article'],
];

export function PerformanceEntryEditor({ entry, pickers = {} }: { entry?: Entry; pickers?: Pickers }) {
  const router = useRouter();
  const editing = Boolean(entry?.id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const status = entry?.status || 'recorded';

  const num = (v: unknown) => (v == null ? '' : String(v));
  const [impressions, setImpr] = useState(num(entry?.impressions));
  const [clicks, setClicks] = useState(num(entry?.clicks));
  const [spend, setSpend] = useState(num(entry?.spend));
  const [conversions, setConv] = useState(num(entry?.conversions));
  const [revenue, setRevenue] = useState(num(entry?.revenue));
  const [rels, setRels] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    for (const [, field] of REL) r[field] = String((entry as Record<string, unknown> | undefined)?.[field] ?? '');
    return r;
  });
  const setRel = (k: string, v: string) => setRels((s) => ({ ...s, [k]: v }));

  const computed = useMemo(
    () => computeMetrics({ impressions: Number(impressions || 0), clicks: Number(clicks || 0), spend: Number(spend || 0), conversions: Number(conversions || 0), revenue: Number(revenue || 0) }),
    [impressions, clicks, spend, conversions, revenue],
  );

  function collect(form: HTMLFormElement) {
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? '');
    const body: Record<string, unknown> = {
      platform: get('platform'), channelType: get('channelType'),
      entryDate: get('entryDate'), entryDateEnd: get('entryDateEnd'),
      campaignName: get('campaignName'), adSetName: get('adSetName'), creativeName: get('creativeName'),
      impressions, clicks, spend, conversions, revenue,
      orders: get('orders'), leads: get('leads'), addToCart: get('addToCart'),
      currency: get('currency') || 'USD', notes: get('notes'),
    };
    for (const [, field] of REL) body[field] = rels[field] || null;
    return body;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    const data = collect(e.currentTarget);
    try {
      if (editing) {
        const r = await fetch(`/api/app/performance/${entry!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not save.'); else { setMsg('Saved.'); router.refresh(); }
      } else {
        const r = await fetch('/api/app/performance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) setErr(j.error || 'Could not create.'); else { router.push(`/app/performance/${j.id}`); return; }
      }
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }

  async function act(action: string) {
    if (action === 'archive' && !confirm('Archive this entry? It is excluded from totals.')) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`/api/app/performance/${entry!.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) setErr(j.error || 'Could not update.'); else router.refresh();
    } catch { setErr('Network error.'); } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/app/performance/${entry!.id}`, { method: 'DELETE' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.error || 'Could not delete.'); setBusy(false); } else router.push('/app/performance');
    } catch { setErr('Network error.'); setBusy(false); }
  }

  return (
    <>
      {err ? <div className="adm-panel warn" role="alert" style={{ marginBottom: 12 }}>{err}</div> : null}
      {msg ? <div className="adm-panel ok" role="status" style={{ marginBottom: 12 }}>{msg}</div> : null}

      {editing ? (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-row">
            <span className="t">Status <span className={`adm-badge ${perfStatusVariant(status)}`}>{PERF_STATUS_LABELS[status] || status}</span></span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {status !== 'recorded' ? <button className="adm-btn" disabled={busy} onClick={() => act('record')}>Mark recorded</button> : null}
              {status !== 'draft' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('draft')}>Back to draft</button> : null}
              {status !== 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('archive')}>Archive</button> : null}
              {status === 'archived' ? <button className="adm-btn ghost" disabled={busy} onClick={() => act('record')}>Restore</button> : null}
            </span>
          </div>
          <p className="adm-note" style={{ marginTop: 8 }}>User-provided data — not synced or verified. Archived entries are excluded from totals.</p>
        </div>
      ) : null}

      <div className="adm-cols-2" style={{ alignItems: 'start', gap: 16 }}>
        <form className="form" onSubmit={submit}>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="platform">Platform</label>
              <select id="platform" name="platform" className="adm-select" defaultValue={entry?.platform || 'generic'}>
                {Object.entries(PERF_PLATFORM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="channelType">Channel</label>
              <select id="channelType" name="channelType" className="adm-select" defaultValue={entry?.channelType || 'generic'}>
                {Object.entries(PERF_CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="entryDate">Date (or range start)</label><input id="entryDate" name="entryDate" type="date" defaultValue={entry?.entryDate || ''} /></div>
            <div className="field"><label htmlFor="entryDateEnd">Range end (optional)</label><input id="entryDateEnd" name="entryDateEnd" type="date" defaultValue={entry?.entryDateEnd || ''} /></div>
          </div>
          <div className="field"><label htmlFor="campaignName">Campaign name</label><input id="campaignName" name="campaignName" defaultValue={entry?.campaignName || ''} maxLength={300} /></div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="adSetName">Ad set / audience</label><input id="adSetName" name="adSetName" defaultValue={entry?.adSetName || ''} maxLength={300} /></div>
            <div className="field"><label htmlFor="creativeName">Creative name</label><input id="creativeName" name="creativeName" defaultValue={entry?.creativeName || ''} maxLength={300} /></div>
          </div>

          <div className="adm-panel" style={{ marginBottom: 12 }}><strong>Link to your work</strong> (optional, workspace-only)</div>
          <div className="adm-cols-2">
            {REL.map(([pk, field, label]) => {
              const opts = pickers[pk] || [];
              if (!opts.length) return null;
              return (
                <div className="field" key={field}><label htmlFor={field}>{label}</label>
                  <select id={field} className="adm-select" value={rels[field] || ''} onChange={(e) => setRel(field, e.target.value)}>
                    <option value="">— none —</option>{opts.map((o) => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="adm-panel" style={{ marginBottom: 12 }}><strong>Metrics</strong> — your real numbers. Nothing is invented or synced.</div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="impressions">Impressions</label><input id="impressions" type="number" min="0" step="any" value={impressions} onChange={(e) => setImpr(e.target.value)} /></div>
            <div className="field"><label htmlFor="clicks">Clicks</label><input id="clicks" type="number" min="0" step="any" value={clicks} onChange={(e) => setClicks(e.target.value)} /></div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="spend">Spend</label><input id="spend" type="number" min="0" step="any" value={spend} onChange={(e) => setSpend(e.target.value)} /></div>
            <div className="field"><label htmlFor="revenue">Revenue</label><input id="revenue" type="number" min="0" step="any" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="conversions">Conversions</label><input id="conversions" type="number" min="0" step="any" value={conversions} onChange={(e) => setConv(e.target.value)} /></div>
            <div className="field"><label htmlFor="leads">Leads</label><input id="leads" name="leads" type="number" min="0" step="any" defaultValue={num(entry?.leads)} /></div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="orders">Orders</label><input id="orders" name="orders" type="number" min="0" step="any" defaultValue={num(entry?.orders)} /></div>
            <div className="field"><label htmlFor="addToCart">Add to cart</label><input id="addToCart" name="addToCart" type="number" min="0" step="any" defaultValue={num(entry?.addToCart)} /></div>
          </div>
          <div className="adm-cols-2">
            <div className="field"><label htmlFor="currency">Currency</label><input id="currency" name="currency" defaultValue={entry?.currency || 'USD'} maxLength={8} /></div>
          </div>
          <div className="field"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={2} defaultValue={entry?.notes || ''} maxLength={4000} /></div>

          <button className="adm-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save entry'}</button>
          {editing ? <button className="adm-btn ghost" type="button" disabled={busy} onClick={del} style={{ marginLeft: 8 }}>Delete</button> : null}
        </form>

        <div className="adm-card" style={{ position: 'sticky', top: 12 }}>
          <div className="adm-row"><span className="t">Calculated metrics</span></div>
          <p className="adm-note" style={{ marginTop: 8 }}>Calculated live from the numbers you enter. “—” = not enough data (e.g. zero clicks/spend).</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <span><span className="adm-note">CTR</span><br /><strong>{fmtPct(computed.ctr)}</strong></span>
            <span><span className="adm-note">CPC</span><br /><strong>{fmtMoney(computed.cpc)}</strong></span>
            <span><span className="adm-note">CPM</span><br /><strong>{fmtMoney(computed.cpm)}</strong></span>
            <span><span className="adm-note">Conv. rate</span><br /><strong>{fmtPct(computed.convRate)}</strong></span>
            <span><span className="adm-note">CPA</span><br /><strong>{fmtMoney(computed.cpa)}</strong></span>
            <span><span className="adm-note">ROAS</span><br /><strong>{fmtX(computed.roas)}</strong></span>
            <span><span className="adm-note">Rev / click</span><br /><strong>{fmtMoney(computed.rpc)}</strong></span>
          </div>
        </div>
      </div>
    </>
  );
}
