import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, ComingSoon, fmtDate } from '../_ui';

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
      <TopBar title="Products" sub="The catalog behind your reviews and guides, scoped to your workspace." />
      <div className="adm-content">
        <div style={{ marginBottom: 16 }}>
          <ComingSoon>Self-serve product creation is coming next. For now, submit products through <strong>Product Requests</strong> — an editor sets them up and nothing generates or publishes automatically.</ComingSoon>
        </div>
        <Card title={`${docs.length} product${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Title', 'Offer type', 'Status', 'Added']} rows={rows} empty="No products yet. Start with a product request." />
        </Card>
      </div>
    </>
  );
}
