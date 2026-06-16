import { getAdminOverview, type Doc } from '@/lib/public';
import { emailProvider, emailEnabled } from '@/lib/email';
import { Section, Stat, Card, Empty, StatusBadge } from '../_components';

export const dynamic = 'force-dynamic';

// Internal ops/health (auth enforced in middleware). Env shown present/missing only.
export default async function HealthPage() {
  const { counts, recentContacts, recentRequests } = await getAdminOverview();
  const c = (k: string): number => counts[k] ?? 0;
  const presence = (k: string) => (process.env[k] ? 'present' : 'missing');

  const STATS: Array<[string, number]> = [
    ['Published', c('published')], ['Ready for review', c('review')], ['Drafts', c('drafts')],
    ['Categories', c('categories')], ['Authors', c('authors')], ['Media', c('media')],
    ['Subscribers', c('subscribers')], ['Active subs', c('subsActive')], ['Total views', c('totalViews')],
    ['Requests waiting', c('requestsOpen')], ['Requests approved', c('requestsApproved')], ['Requests processing', c('requestsProcessing')],
    ['Runs OK', c('runsPublished')], ['Runs flagged', c('runsFlagged')], ['Runs failed', c('runsFailed')], ['New contacts', c('contactsNew')],
  ];

  return (
    <>
      <div className="adm-topbar">
        <h1>System health</h1>
        <span className="adm-sub">Operational counts, email-delivery configuration (presence only), and recent intake.</span>
      </div>
      <div className="adm-content">
        <Section title="Counts">
          <div className="adm-cols">
            {STATS.map(([label, n]) => <Stat key={label} label={label} value={n} />)}
          </div>
        </Section>

        <Section title="Email delivery (presence only — no secret values)">
          <Card>
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

        <Section title="Recent intake">
          <div className="adm-cols-2">
            <Card title="Recent contact messages">
              {recentContacts.length ? recentContacts.map((m: Doc) => (
                <div key={String(m.id)} className="adm-row"><span className="t">{(m.reason as string) || 'general'} · {m.email as string}</span><StatusBadge status={String(m.status)} /></div>
              )) : <Empty>None yet.</Empty>}
            </Card>
            <Card title="Recent product requests">
              {recentRequests.length ? recentRequests.map((r: Doc) => (
                <div key={String(r.id)} className="adm-row"><span className="t">{(r.productName as string) || '(untitled)'}</span><StatusBadge status={String(r.status)} /></div>
              )) : <Empty>None yet.</Empty>}
            </Card>
          </div>
        </Section>
      </div>
    </>
  );
}
