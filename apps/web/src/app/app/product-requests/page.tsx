import { requireWorkspace, wsList } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { TopBar, Card, DataTable, StatusBadge, WsLink, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function ProductRequestsPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'product-requests', { sort: '-createdAt', limit: 100 });
  const rows = docs.map((r) => [
    <a key="t" href={`/app/product-requests/${r.id}`}>{(r.productName as string) || '(untitled)'}</a>,
    String(r.requesterEmail ?? '—'),
    <StatusBadge key="s" status={String(r.status)} />,
    fmtDate(r.submittedAt || r.createdAt),
  ]);
  return (
    <>
      <TopBar
        title="Seller Intake Pipeline"
        sub="Seller submissions awaiting BubbaAffiliate review. Approval is always manual — nothing enters a campaign automatically."
        actions={canWrite(ws.role) ? <WsLink href="/app/product-requests/new" primary>New submission</WsLink> : undefined}
      />
      <div className="adm-content">
        <Card title={`${docs.length} submission${docs.length === 1 ? '' : 's'}`}>
          <DataTable
            head={['Offer', 'Seller', 'Status', 'Submitted']}
            rows={rows}
            empty="No seller submissions yet. Use ‘New submission’ to intake the first offer — the BubbaAffiliate team reviews every one."
          />
        </Card>
      </div>
    </>
  );
}
