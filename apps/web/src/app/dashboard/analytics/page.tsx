import { getMostReadDashboard, getDailyViewTrend, type Doc } from '@/lib/public';
import { emailProvider, emailEnabled } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Internal analytics surface (auth enforced in middleware). First-party views only.
export default async function AnalyticsPage() {
  const rows = await getMostReadDashboard(50);
  const trend = await getDailyViewTrend(14);
  const trendMax = Math.max(1, ...trend.map((t) => t.count));

  // Env PRESENCE only — never prints any secret/value.
  const presence = (k: string) => (process.env[k] ? 'present' : 'missing');
  const delivery = {
    provider: emailProvider(),
    enabled: emailEnabled() ? 'enabled' : 'local (no external send)',
    RESEND_API_KEY: presence('RESEND_API_KEY'),
    NEWSLETTER_FROM: presence('NEWSLETTER_FROM'),
    NEWSLETTER_REPLY_TO: presence('NEWSLETTER_REPLY_TO'),
    NEWSLETTER_DOUBLE_OPT_IN: presence('NEWSLETTER_DOUBLE_OPT_IN'),
    CONTACT_NOTIFY_TO: presence('CONTACT_NOTIFY_TO'),
  };

  const cellBorder = '1px solid #e5e7eb';
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', color: '#6b7280' };
  const td: React.CSSProperties = { padding: '8px 10px', borderBottom: cellBorder, fontSize: 14 };
  const num: React.CSSProperties = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Analytics</h1>
      <p style={{ color: '#6b7280', marginTop: 4 }}>First-party, privacy-light pageviews (article id + UTC day + count; no PII). Bot user-agents are filtered at ingest.</p>

      <section style={{ margin: '20px 0', padding: 16, border: cellBorder, borderRadius: 10, background: '#f9fafb', maxWidth: 560 }}>
        <strong style={{ fontSize: 13 }}>Email delivery configuration (presence only)</strong>
        <table style={{ width: '100%', marginTop: 8, fontSize: 13 }}>
          <tbody>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>Provider</td><td style={{ textAlign: 'right' }}>{delivery.provider} — {delivery.enabled}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>RESEND_API_KEY</td><td style={{ textAlign: 'right' }}>{delivery.RESEND_API_KEY}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>NEWSLETTER_FROM</td><td style={{ textAlign: 'right' }}>{delivery.NEWSLETTER_FROM}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>NEWSLETTER_REPLY_TO</td><td style={{ textAlign: 'right' }}>{delivery.NEWSLETTER_REPLY_TO}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>NEWSLETTER_DOUBLE_OPT_IN</td><td style={{ textAlign: 'right' }}>{delivery.NEWSLETTER_DOUBLE_OPT_IN}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#6b7280' }}>CONTACT_NOTIFY_TO</td><td style={{ textAlign: 'right' }}>{delivery.CONTACT_NOTIFY_TO}</td></tr>
          </tbody>
        </table>
      </section>

      <h2 style={{ fontSize: 16 }}>Daily views (last 14 days)</h2>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, margin: '8px 0 24px', maxWidth: 640 }}>
        {trend.map((t) => (
          <div key={t.date} title={`${t.date}: ${t.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ width: '100%', background: '#14543f', borderRadius: '3px 3px 0 0', height: `${Math.round((t.count / trendMax) * 70)}px`, minHeight: t.count > 0 ? 3 : 0 }} />
            <span style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{t.date.slice(5)}</span>
          </div>
        ))}
      </div>
      {trend.every((t) => t.count === 0) ? <p style={{ color: '#6b7280', fontSize: 13, marginTop: -16 }}>No views in the last 14 days yet.</p> : null}

      <h2 style={{ fontSize: 18 }}>Most read</h2>
      {rows.length ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 920 }}>
          <thead>
            <tr>
              <th style={th}>Article</th><th style={th}>Status</th><th style={th}>Category</th><th style={th}>Author</th>
              <th style={{ ...th, textAlign: 'right' }}>7d</th><th style={{ ...th, textAlign: 'right' }}>30d</th><th style={{ ...th, textAlign: 'right' }}>All</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const a = r.article as Doc;
              const cat = typeof a.category === 'object' ? (a.category as Doc)?.name : '';
              const author = typeof a.author === 'object' ? (a.author as Doc)?.name : '';
              return (
                <tr key={String(a.id)}>
                  <td style={td}>{a.title as string}</td>
                  <td style={td}>{a.editorialStatus as string}</td>
                  <td style={td}>{(cat as string) || '—'}</td>
                  <td style={td}>{(author as string) || '—'}</td>
                  <td style={num}>{r.v7}</td><td style={num}>{r.v30}</td><td style={num}>{r.vAll}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#6b7280' }}>No views recorded yet. Public &ldquo;Most read&rdquo; falls back to a deterministic editorial ranking — no fabricated counts are shown anywhere.</p>
      )}
    </div>
  );
}
