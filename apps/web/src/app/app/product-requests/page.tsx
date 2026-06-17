import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, StatusBadge, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function ProductRequestsPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'product-requests', { sort: '-createdAt', limit: 100 });
  const rows = docs.map((r) => [
    (r.productName as string) || '(untitled)',
    String(r.requesterEmail ?? '—'),
    <StatusBadge key="s" status={String(r.status)} />,
    fmtDate(r.submittedAt || r.createdAt),
  ]);
  return (
    <>
      <TopBar
        title="Product requests"
        sub="Submit products for editorial review. Approval is always manual — nothing is generated or published automatically."
        actions={<WsLink href="/request-product" primary>Submit a product</WsLink>}
      />
      <div className="adm-content">
        <Card title={`${docs.length} request${docs.length === 1 ? '' : 's'}`}>
          <DataTable
            head={['Product', 'Requester', 'Status', 'Submitted']}
            rows={rows}
            empty="No product requests yet. Use ‘Submit a product’ to propose your first review — an editor reviews every submission."
          />
        </Card>
      </div>
    </>
  );
}
