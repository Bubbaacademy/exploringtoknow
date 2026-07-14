import { requireWorkspace, wsList } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
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
        title="Offers"
        sub="Seller offers, products and services managed for campaigns. Submitting an offer sends it for BubbaAffiliate review before it goes into a campaign."
        actions={canWrite(ws.role) ? <WsLink href="/app/products/new" primary>Add an offer</WsLink> : undefined}
      />
      <div className="adm-content">
        <Card title={`${docs.length} offer${docs.length === 1 ? '' : 's'}`}>
          <DataTable head={['Title', 'Offer type', 'Status', 'Added']} rows={rows} empty="No offers yet. Click ‘Add an offer’ to submit your first one — BubbaAffiliate reviews it before anything is generated or runs." />
        </Card>
      </div>
    </>
  );
}
