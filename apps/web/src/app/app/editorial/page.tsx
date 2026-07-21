import { requireWorkspace, wsList, wsCount } from '@/lib/workspace';
import { TopBar, Section, Stat, Card, Empty, StatusBadge, EditorialStatusBadge, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

const PIPELINE = ['Request', 'Product', 'Brief / Intelligence', 'Article draft', 'Editorial review', 'Published'] as const;

export default async function EditorialPage() {
  const ws = await requireWorkspace();
  const [published, review, drafts, runs, reqWaiting, reqNoCat, reqNoPerm, reviewDocs, runDocs, recentProducts] = await Promise.all([
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'published' } }),
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'ready_for_review' } }),
    wsCount(ws.scope, 'articles', { editorialStatus: { equals: 'draft' } }),
    wsCount(ws.scope, 'generation-runs'),
    wsCount(ws.scope, 'product-requests', { status: { in: ['submitted', 'under_review'] } }),
    wsCount(ws.scope, 'product-requests', { and: [{ status: { equals: 'submitted' } }, { requestedCategory: { exists: false } }] }),
    wsCount(ws.scope, 'product-requests', { and: [{ status: { equals: 'submitted' } }, { imagePermissionConfirmed: { equals: false } }] }),
    wsList(ws.scope, 'articles', { sort: '-createdAt', limit: 8, depth: 1, extra: { editorialStatus: { in: ['draft', 'ready_for_review'] } } }),
    wsList(ws.scope, 'generation-runs', { sort: '-createdAt', limit: 6 }),
    wsList(ws.scope, 'products', { sort: '-createdAt', limit: 6 }),
  ]);
  const warnings: Array<[string, number]> = [];
  if (reqNoCat > 0) warnings.push(['Submitted requests missing a category', reqNoCat]);
  if (reqNoPerm > 0) warnings.push(['Submitted requests missing image permission', reqNoPerm]);
  if (review > 0) warnings.push(['Article drafts ready for your review', review]);
  const nextAction = reqWaiting > 0
    ? `${reqWaiting} request${reqWaiting === 1 ? '' : 's'} awaiting editorial review.`
    : (review > 0 ? `${review} draft${review === 1 ? '' : 's'} ready for your review.` : 'Create or review an article draft in Payload /admin.');
  return (
    <>
      <TopBar
        title="Editorial Console"
        sub="The ExploringToKnow publishing pipeline — editorial content for the media layer. Every step is manual and reviewed by you; nothing generates or publishes automatically."
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
            <Stat label="Requests waiting" value={reqWaiting} tone={reqWaiting > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={drafts} />
            <Stat label="In review" value={review} tone={review > 0 ? 'attn' : undefined} />
            <Stat label="Published" value={published} tone="good" />
            <Stat label="Generation runs" value={runs} />
          </div>
        </Section>

        <Section title="Needs attention">
          {warnings.length ? (
            <div className="adm-panel warn">
              {warnings.map(([label, n]) => <div key={label} className="adm-row"><span className="t">{label}</span><strong>{n}</strong></div>)}
            </div>
          ) : (
            <div className="adm-panel ok">All clear — nothing needs your attention right now.</div>
          )}
          <p className="adm-note" style={{ marginTop: 8 }}><strong>Next:</strong> {nextAction}</p>
        </Section>

        <Section title="Recent products">
          <Card>
            {recentProducts.length ? recentProducts.map((p) => (
              <div key={String(p.id)} className="adm-row"><span className="t">{(p.title as string) || '(untitled)'}</span><StatusBadge status={String(p.status)} /></div>
            )) : <Empty>No products yet — they appear here after an editor approves a request.</Empty>}
          </Card>
        </Section>
        <Section title="In the queue" action={<WsLink href="/app/articles">Open the article desk</WsLink>}>
          <Card title="Drafts & in review">
            {reviewDocs.length ? reviewDocs.map((a) => (
              <div key={String(a.id)} className="adm-row"><span className="t">{(a.title as string) || '(untitled)'}</span><EditorialStatusBadge status={String(a.editorialStatus)} /></div>
            )) : <Empty>Nothing in the editorial queue yet. Start an article request to begin — an editor reviews every step.</Empty>}
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
