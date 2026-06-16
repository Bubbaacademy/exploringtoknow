import { getAdminOverview, type Doc } from '@/lib/public';
import { emailProvider, emailEnabled } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Internal ops/health surface (auth enforced in middleware). Env shown as
// present/missing only — never any secret value.
export default async function HealthPage() {
  const { counts, recentContacts, recentRequests } = await getAdminOverview();
  const presence = (k: string) => (process.env[k] ? 'present' : 'missing');

  const card: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fff' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 12, margin: '12px 0 24px' };
  const stat: React.CSSProperties = { ...card, background: '#f9fafb' };
  const big: React.CSSProperties = { fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' };
  const rowLine: React.CSSProperties = { padding: '4px 0', display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f3f4f6' };

  const c = (k: string): number => counts[k] ?? 0;
  const STATS: Array<[string, number]> = [
    ['Published', c('published')], ['Drafts', c('drafts')], ['In review', c('review')],
    ['Categories', c('categories')], ['Authors', c('authors')],
    ['Subscribers', c('subscribers')], ['Active subs', c('subsActive')],
    ['New contacts', c('contactsNew')], ['Open requests', c('requestsOpen')],
    ['Media', c('media')], ['Total views', c('totalViews')],
  ];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>System Health</h1>

      <h2 style={{ fontSize: 16 }}>Counts</h2>
      <div style={grid}>
        {STATS.map(([label, n]) => (
          <div key={label} style={stat}><div style={big}>{n}</div><div style={lbl}>{label}</div></div>
        ))}
      </div>

      <h2 style={{ fontSize: 16 }}>Email delivery (presence only — no secret values)</h2>
      <div style={{ ...card, maxWidth: 560, marginBottom: 24 }}>
        <div style={rowLine}><span>Provider</span><strong>{emailProvider()} — {emailEnabled() ? 'enabled' : 'local (no external send)'}</strong></div>
        <div style={rowLine}><span>RESEND_API_KEY</span><strong>{presence('RESEND_API_KEY')}</strong></div>
        <div style={rowLine}><span>NEWSLETTER_FROM</span><strong>{presence('NEWSLETTER_FROM')}</strong></div>
        <div style={rowLine}><span>NEWSLETTER_REPLY_TO</span><strong>{presence('NEWSLETTER_REPLY_TO')}</strong></div>
        <div style={rowLine}><span>NEWSLETTER_DOUBLE_OPT_IN</span><strong>{presence('NEWSLETTER_DOUBLE_OPT_IN')}</strong></div>
        <div style={{ ...rowLine, borderBottom: 'none' }}><span>CONTACT_NOTIFY_TO</span><strong>{presence('CONTACT_NOTIFY_TO')}</strong></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
        <div style={card}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Recent contact messages</h2>
          {recentContacts.length ? recentContacts.map((c: Doc) => (
            <div key={String(c.id)} style={rowLine}><span>{(c.reason as string) || 'general'} · {(c.email as string)}</span><strong>{c.status as string}</strong></div>
          )) : <p style={{ color: '#6b7280', fontSize: 13 }}>None yet.</p>}
        </div>
        <div style={card}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Recent product requests</h2>
          {recentRequests.length ? recentRequests.map((r: Doc) => (
            <div key={String(r.id)} style={rowLine}><span>{(r.productName as string) || '(untitled)'}</span><strong>{r.status as string}</strong></div>
          )) : <p style={{ color: '#6b7280', fontSize: 13 }}>None yet.</p>}
        </div>
      </div>
    </div>
  );
}
