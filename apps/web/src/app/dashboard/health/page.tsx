import { getAdminOverview, type Doc } from '@/lib/public';
import { emailProviderStatus } from '@/lib/email';
import { Section, Stat, Card, Empty, StatusBadge } from '../_components';

export const dynamic = 'force-dynamic';

// Internal ops/health (auth enforced in middleware). Env shown present/missing only.
export default async function HealthPage() {
  const { counts, recentContacts, recentRequests } = await getAdminOverview();
  const c = (k: string): number => counts[k] ?? 0;
  const email = emailProviderStatus();
  const yn = (b: boolean) => (b ? 'present' : 'missing');
  const ENV_KEYS = ['NEWSLETTER_PROVIDER', 'RESEND_API_KEY', 'NEWSLETTER_FROM', 'NEWSLETTER_REPLY_TO', 'NEWSLETTER_DOUBLE_OPT_IN', 'CONTACT_NOTIFY_TO'] as const;
  const FLOWS: Array<[string, boolean]> = [
    ['Welcome email', email.readiness.welcome],
    ['Team invitation email', email.readiness.teamInvite],
    ['Newsletter confirmation', email.readiness.newsletterConfirm],
    ['Newsletter unsubscribe', email.readiness.newsletterUnsubscribe],
    ['Contact notification', email.readiness.contactNotify],
  ];

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
          <div className="adm-cols-2">
            <Card title="Provider & environment">
              <table className="adm-table">
                <tbody>
                  <tr><td>Provider</td><td className="num">{email.provider}</td></tr>
                  <tr><td>Mode</td><td className="num"><span className={`adm-badge ${email.active ? 'ok' : 'warn'}`}>{email.mode}</span></td></tr>
                  <tr><td>Double opt-in</td><td className="num">{email.doubleOptIn ? 'on' : 'off'}</td></tr>
                  {email.missing.length ? (
                    <tr><td>Missing to activate</td><td className="num"><span className="adm-badge warn">{email.missing.join(', ')}</span></td></tr>
                  ) : null}
                  {ENV_KEYS.map((k) => (
                    <tr key={k}><td>{k}</td><td className="num"><span className={`adm-badge ${email.keys[k] ? 'ok' : 'warn'}`}>{yn(email.keys[k])}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Per-flow readiness">
              <table className="adm-table">
                <tbody>
                  {FLOWS.map(([label, ready]) => (
                    <tr key={label}><td>{label}</td><td className="num"><span className={`adm-badge ${ready ? 'ok' : 'warn'}`}>{ready ? 'real-send' : 'local-safe'}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
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
