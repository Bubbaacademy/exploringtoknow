import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, WsLink, fmtDate, refName } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'articles', { sort: '-createdAt', limit: 100, depth: 1 });
  const rows = docs.map((a) => [
    (a.title as string) || '(untitled)',
    refName(a.category),
    <StatusBadge key="s" status={String(a.editorialStatus)} />,
    fmtDate(a.editorialPublishedAt || a.createdAt),
  ]);
  return (
    <>
      <TopBar
        title="Articles"
        sub="Articles in your workspace. Only ‘Published’ items appear on your public site — nothing publishes automatically."
        actions={<WsLink href="/app/product-requests" primary>Request an article</WsLink>}
      />
      <div className="adm-content">
        <Card title={`${docs.length} article${docs.length === 1 ? '' : 's'}`}>
          <DataTable
            head={['Title', 'Category', 'Editorial status', 'Date']}
            rows={rows}
            empty="No articles yet. Submit a product request to start the editorial pipeline — an editor reviews everything before anything is generated or published."
          />
        </Card>
      </div>
    </>
  );
}
