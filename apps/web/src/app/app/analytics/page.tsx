import { requireWorkspace, wsList, wsCount } from '@/lib/workspace';
import { TopBar, Section, Stat, Card, Empty, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const ws = await requireWorkspace();
  const [views, published] = await Promise.all([
    wsList(ws.scope, 'article-views', { sort: '-viewDate', limit: 1000 }),
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'published' } }),
  ]);
  const totalViews = views.reduce((s, v) => s + (Number(v.count) || 0), 0);
  const recent = views.slice(0, 14);
  return (
    <>
      <TopBar title="Analytics" sub="First-party, privacy-light page views — scoped to your workspace. No third-party trackers." />
      <div className="adm-content">
        <Section title="Overview">
          <div className="adm-cols">
            <Stat label="Total views" value={totalViews} tone={totalViews > 0 ? 'good' : undefined} />
            <Stat label="View records" value={views.length} />
            <Stat label="Published articles" value={published} />
          </div>
        </Section>
        <Section title="Recent days">
          <Card>
            {recent.length ? recent.map((v) => (
              <div key={String(v.id)} className="adm-row"><span className="t">{fmtDate(v.viewDate)}</span><strong>{Number(v.count) || 0} views</strong></div>
            )) : <Empty>No views recorded yet. Analytics populate as your published articles get traffic — figures are never fabricated.</Empty>}
          </Card>
        </Section>
      </div>
    </>
  );
}
