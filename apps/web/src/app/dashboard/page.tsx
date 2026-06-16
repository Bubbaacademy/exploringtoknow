import Link from 'next/link';
import { getAdminOverview, listMostReadArticles, listTrendingArticles, type Doc } from '@/lib/public';
import { Section, Stat, Card, Empty, StatusBadge } from './_components';

export const dynamic = 'force-dynamic';

// Editorial command center (auth enforced in middleware). Real data only.
export default async function DashboardHome() {
  const { counts, recentContacts, recentRequests, requestWarnings } = await getAdminOverview();
  const c = (k: string): number => counts[k] ?? 0;
  const real = await listMostReadArticles(30, 5);
  const topViewed = real.length ? real : await listTrendingArticles(5);
  const topReal = real.length > 0;

  const pipelineWarn = ([
    ['Published without category', c('warnPubNoCategory')],
    ['Published without author', c('warnPubNoAuthor')],
    ['Published without hero image', c('warnPubNoHero')],
    ['Ready-for-review without category (blocks publish)', c('warnReviewNoCategory')],
  ] as Array<[string, number]>).filter(([, n]) => n > 0);

  const reqWarn = ([
    ['Submitted: missing category', requestWarnings.noCategory ?? 0],
    ['Submitted: missing image permission', requestWarnings.noPermission ?? 0],
    ['Submitted: fewer than 3 images', requestWarnings.fewImages ?? 0],
    ['Submitted: missing product URL', requestWarnings.noUrl ?? 0],
  ] as Array<[string, number]>).filter(([, n]) => n > 0);

  return (
    <>
      <div className="adm-topbar">
        <h1>Editorial command center</h1>
        <span className="adm-sub">Pipeline: Request → manual approve → Product → Brief/Intelligence → Article (ready_for_review) → editor publishes. Nothing publishes automatically.</span>
      </div>
      <div className="adm-content">
        <Section title="System overview">
          <div className="adm-cols">
            <Stat label="Published" value={c('published')} tone="good" />
            <Stat label="Ready for review" value={c('review')} tone={c('review') > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={c('drafts')} />
            <Stat label="Requests waiting" value={c('requestsOpen')} tone={c('requestsOpen') > 0 ? 'attn' : undefined} />
            <Stat label="New contacts" value={c('contactsNew')} tone={c('contactsNew') > 0 ? 'attn' : undefined} />
            <Stat label="Active subscribers" value={c('subsActive')} />
            <Stat label="Total views" value={c('totalViews')} />
            <Stat label="Categories" value={c('categories')} />
            <Stat label="Authors" value={c('authors')} />
            <Stat label="Media" value={c('media')} />
          </div>
        </Section>

        {pipelineWarn.length || reqWarn.length ? (
          <Section title="Needs attention">
            <div className="adm-cols-2">
              {pipelineWarn.length ? (
                <div className="adm-panel warn">
                  <strong>Article pipeline</strong>
                  {pipelineWarn.map(([label, n]) => <div key={label} className="adm-row"><span className="t">{label}</span><strong>{n}</strong></div>)}
                </div>
              ) : null}
              {reqWarn.length ? (
                <div className="adm-panel warn">
                  <strong>Product-request triage (submitted, not approvable yet)</strong>
                  {reqWarn.map(([label, n]) => <div key={label} className="adm-row"><span className="t">{label}</span><strong>{n}</strong></div>)}
                </div>
              ) : null}
            </div>
          </Section>
        ) : (
          <Section title="Needs attention">
            <div className="adm-panel ok">All clear — published articles have category, author and hero image; no blocked requests.</div>
          </Section>
        )}

        <Section title="Editorial pipeline">
          <div className="adm-cols">
            <Stat label="Requests approved" value={c('requestsApproved')} />
            <Stat label="Requests processing" value={c('requestsProcessing')} />
            <Stat label="Runs OK" value={c('runsPublished')} tone="good" />
            <Stat label="Runs flagged" value={c('runsFlagged')} tone={c('runsFlagged') > 0 ? 'attn' : undefined} />
            <Stat label="Runs failed" value={c('runsFailed')} tone={c('runsFailed') > 0 ? 'attn' : undefined} />
            <Stat label="Runs running" value={c('runsRunning')} />
          </div>
        </Section>

        <Section title="Activity">
          <div className="adm-cols-2">
            <Card title={topReal ? 'Top viewed (last 30 days)' : 'Editor’s picks (no view data yet)'}>
              {topViewed.length ? topViewed.map((a: Doc) => (
                <div key={String(a.id)} className="adm-row"><span className="t">{a.title as string}</span><StatusBadge status={String(a.editorialStatus)} /></div>
              )) : <Empty>No published articles yet.</Empty>}
            </Card>
            <Card title="Recent product requests">
              {recentRequests.length ? recentRequests.map((r: Doc) => (
                <div key={String(r.id)} className="adm-row"><span className="t">{(r.productName as string) || '(untitled)'}</span><StatusBadge status={String(r.status)} /></div>
              )) : <Empty>None yet.</Empty>}
            </Card>
            <Card title="Recent contact messages">
              {recentContacts.length ? recentContacts.map((m: Doc) => (
                <div key={String(m.id)} className="adm-row"><span className="t">{(m.reason as string) || 'general'} · {m.email as string}</span><StatusBadge status={String(m.status)} /></div>
              )) : <Empty>None yet.</Empty>}
            </Card>
          </div>
        </Section>

        <Section title="Quick links">
          <div className="adm-quicklinks">
            <Link className="adm-btn" href="/dashboard/analytics">Analytics</Link>
            <Link className="adm-btn ghost" href="/dashboard/health">System Health</Link>
            <Link className="adm-btn ghost" href="/admin/collections/product-requests">Review requests</Link>
            <Link className="adm-btn ghost" href="/admin/collections/articles">Manage articles</Link>
            <Link className="adm-btn ghost" href="/admin/collections/contact-messages">Contact inbox</Link>
            <Link className="adm-btn ghost" href="/admin">Payload admin</Link>
          </div>
        </Section>
      </div>
    </>
  );
}
