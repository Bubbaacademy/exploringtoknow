import { getMostReadDashboard, getDailyViewTrend, type Doc } from '@/lib/public';
import { emailProvider, emailEnabled } from '@/lib/email';
import { Section, Card, Empty, StatusBadge, TrendBars } from '../_components';

export const dynamic = 'force-dynamic';

// Internal analytics (auth enforced in middleware). First-party views only; no PII.
export default async function AnalyticsPage() {
  const rows = await getMostReadDashboard(50);
  const trend = await getDailyViewTrend(14);
  const presence = (k: string) => (process.env[k] ? 'present' : 'missing');

  return (
    <>
      <div className="adm-topbar">
        <h1>Analytics</h1>
        <span className="adm-sub">First-party, privacy-light pageviews (article + UTC day + count; no PII). Bot user-agents filtered at ingest. No fabricated numbers.</span>
      </div>
      <div className="adm-content">
        <Section title="Daily views — last 14 days">
          <Card><TrendBars data={trend} /></Card>
        </Section>

        <Section title="Most read">
          <Card>
            {rows.length ? (
              <table className="adm-table">
                <thead><tr><th>Article</th><th>Status</th><th>Category</th><th>Author</th><th className="num">7d</th><th className="num">30d</th><th className="num">All</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const a = r.article as Doc;
                    const cat = typeof a.category === 'object' ? (a.category as Doc)?.name : '';
                    const author = typeof a.author === 'object' ? (a.author as Doc)?.name : '';
                    return (
                      <tr key={String(a.id)}>
                        <td>{a.title as string}</td>
                        <td><StatusBadge status={String(a.editorialStatus)} /></td>
                        <td>{(cat as string) || '—'}</td>
                        <td>{(author as string) || '—'}</td>
                        <td className="num">{r.v7}</td><td className="num">{r.v30}</td><td className="num">{r.vAll}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <Empty>No views recorded yet. Public “Most read” falls back to a deterministic editorial ranking — no fabricated counts shown anywhere.</Empty>}
          </Card>
        </Section>

        <Section title="Email delivery configuration">
          <Card>
            <p className="adm-note" style={{ marginTop: 0, marginBottom: 10 }}>Presence only — secret values are never shown. Local mode captures subscribers/contacts without sending.</p>
            <table className="adm-table">
              <tbody>
                <tr><td>Provider</td><td className="num">{emailProvider()} — {emailEnabled() ? 'enabled' : 'local (no external send)'}</td></tr>
                {(['RESEND_API_KEY', 'NEWSLETTER_FROM', 'NEWSLETTER_REPLY_TO', 'NEWSLETTER_DOUBLE_OPT_IN', 'CONTACT_NOTIFY_TO'] as const).map((k) => (
                  <tr key={k}><td>{k}</td><td className="num"><span className={`adm-badge ${presence(k) === 'present' ? 'ok' : 'warn'}`}>{presence(k)}</span></td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>
      </div>
    </>
  );
}
