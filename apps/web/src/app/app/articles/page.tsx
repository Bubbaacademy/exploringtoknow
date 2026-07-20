import { requireWorkspace, wsList } from '@/lib/workspace';
import {
  TopBar, Card, Section, Stat, DataTable, WsLink, fmtDate, refName,
  EditorialStatusBadge, PublicStateBadge, ARTICLE_TYPE_LABEL, EDITORIAL_STATUS_LABEL,
} from '../_ui';

export const dynamic = 'force-dynamic';

/**
 * Editorial article list (Phase 2G).
 *
 * Read-only view over the workspace's articles. Deep editing lives in Payload
 * `/admin`; this page exists so an editor can see the state of the desk at a
 * glance.
 *
 * Previously the table had a single ambiguous "Date" column rendering
 * `editorialPublishedAt || createdAt` — so an unpublished draft displayed its
 * creation date in a column editors read as "published". Updated and published
 * are now separate columns, and publication state is shown explicitly rather
 * than inferred from a date.
 */
export default async function ArticlesPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'articles', { sort: '-updatedAt', limit: 100, depth: 1 });

  const countBy = (s: string) => docs.filter((a) => String(a.editorialStatus) === s).length;
  const published = countBy('published');
  const inReview = countBy('ready_for_review');
  const drafts = countBy('draft');

  const rows = docs.map((a) => {
    const status = String(a.editorialStatus ?? '');
    const type = String(a.type ?? '');
    return [
      <div key="t">
        <div>{(a.title as string) || '(untitled)'}</div>
        {a.slug ? <span className="adm-cellsub">/{String(a.slug)}</span> : null}
      </div>,
      refName(a.category),
      ARTICLE_TYPE_LABEL[type] ?? (type ? type.replace(/_/g, ' ') : '—'),
      <EditorialStatusBadge key="s" status={status} />,
      <PublicStateBadge key="p" status={status} />,
      fmtDate(a.updatedAt),
      status === 'published' ? fmtDate(a.editorialPublishedAt) : '—',
    ];
  });

  return (
    <>
      <TopBar
        title="Articles"
        sub="ExploringToKnow editorial content for the publishing layer. Only ‘Published’ items appear on the public magazine — nothing publishes automatically."
        actions={<WsLink href="/app/product-requests" primary>Start an article request</WsLink>}
      />
      <div className="adm-content">
        <Section title="Desk overview">
          <div className="adm-cols">
            <Stat label="Published" value={published} tone="good" />
            <Stat label="In review" value={inReview} tone={inReview > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={drafts} />
            <Stat label="Total" value={docs.length} />
          </div>
        </Section>

        <Card title={`${docs.length} article${docs.length === 1 ? '' : 's'} · newest edits first`}>
          <DataTable
            head={['Title', 'Category', 'Type', 'Editorial status', 'Public', 'Updated', 'Published']}
            rows={rows}
            empty="No articles yet. Start an article request to open the editorial pipeline — an editor reviews everything before anything is generated or published."
          />
          <div className="adm-panel" style={{ marginTop: 12 }}>
            <strong>Editorial statuses.</strong>{' '}
            <b>{EDITORIAL_STATUS_LABEL.draft}</b> — being written, never public.{' '}
            <b>{EDITORIAL_STATUS_LABEL.ready_for_review}</b> — waiting on an editor.{' '}
            <b>{EDITORIAL_STATUS_LABEL.published}</b> — live on the public magazine.{' '}
            <b>{EDITORIAL_STATUS_LABEL.rejected}</b> — not going out as-is.{' '}
            Publication is controlled by editorial status alone: only <b>Published</b> is public, and a human sets it.
            Titles, body, images and SEO are edited in Payload <b>/admin</b>.
          </div>
        </Card>
      </div>
    </>
  );
}
