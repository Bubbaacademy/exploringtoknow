import { requireWorkspace, wsList, wsCount } from '@/lib/workspace';
import { TopBar, Section, Stat, Card, Empty, StatusBadge, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

const PIPELINE = ['Request', 'Product', 'Brief / Intelligence', 'Article draft', 'Editorial review', 'Published'] as const;

export default async function EditorialPage() {
  const ws = await requireWorkspace();
  const [published, review, drafts, runs, reviewDocs, runDocs] = await Promise.all([
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'published' } }),
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'ready_for_review' } }),
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'draft' } }),
    wsCount(ws.scope, 'generation-runs'),
    wsList(ws.scope, 'articles', { sort: '-createdAt', limit: 8, depth: 1, extra: { editorialStatus: { in: ['draft', 'ready_for_review'] } } }),
    wsList(ws.scope, 'generation-runs', { sort: '-createdAt', limit: 6 }),
  ]);
  return (
    <>
      <TopBar
        title="Editorial console"
        sub="Your workspace publishing pipeline. Every step is manual and reviewed by you — nothing generates or publishes automatically."
        actions={<WsLink href="/app/product-requests" primary>Request an article</WsLink>}
      />
      <div className="adm-content">
        <Section title="Pipeline">
          <div className="adm-panel">
            <div className="adm-quicklinks" aria-hidden="true">
              {PIPELINE.map((s, i) => <span key={s} className="adm-badge">{i + 1}. {s}</span>)}
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>Request → product → researched brief → article draft → your review → published. You approve every transition.</p>
          </div>
        </Section>
        <Section title="Status">
          <div className="adm-cols">
            <Stat label="Drafts" value={drafts} />
            <Stat label="Ready for review" value={review} tone={review > 0 ? 'attn' : undefined} />
            <Stat label="Published" value={published} tone="good" />
            <Stat label="Generation runs" value={runs} />
          </div>
        </Section>
        <Section title="In the queue">
          <Card title="Drafts & ready-for-review">
            {reviewDocs.length ? reviewDocs.map((a) => (
              <div key={String(a.id)} className="adm-row"><span className="t">{(a.title as string) || '(untitled)'}</span><StatusBadge status={String(a.editorialStatus)} /></div>
            )) : <Empty>Nothing in the editorial queue yet. Submit a product request to begin.</Empty>}
          </Card>
        </Section>
        <Section title="Recent generation runs">
          <Card>
            {runDocs.length ? runDocs.map((r) => (
              <div key={String(r.id)} className="adm-row"><span className="t">Run #{String(r.id)} · {fmtDate(r.finishedAt || r.createdAt)}</span><StatusBadge status={String(r.status)} /></div>
            )) : <Empty>No generation runs yet.</Empty>}
          </Card>
        </Section>
      </div>
    </>
  );
}
