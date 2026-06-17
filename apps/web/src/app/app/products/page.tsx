import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'products', { sort: '-createdAt', limit: 100 });
  const rows = docs.map((p) => [
    (p.title as string) || '(untitled)',
    String(p.offerType ?? '—').replace(/_/g, ' '),
    <StatusBadge key="s" status={String(p.status)} />,
    fmtDate(p.createdAt),
  ]);
  return (
    <>
      <TopBar
        title="Products"
        sub="The catalog behind your reviews and guides, scoped to your workspace. Submitting a product sends it for editorial review before it becomes a live catalog product."
        actions={<WsLink href="/app/products/new" primary>Add a product</WsLink>}
      />
      <div className="adm-content">
        <Card title={`${docs.length} product${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Title', 'Offer type', 'Status', 'Added']} rows={rows} empty="No products yet. Click ‘Add a product’ to submit your first one — an editor reviews it before anything is generated or published." />
        </Card>
      </div>
    </>
  );
}
