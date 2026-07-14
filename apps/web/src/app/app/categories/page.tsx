import { requireWorkspace, wsList } from '@/lib/workspace';
import { TopBar, Card, DataTable, Badge, ComingSoon } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const ws = await requireWorkspace();
  const docs = await wsList(ws.scope, 'categories', { sort: 'name', limit: 200 });
  const rows = docs.map((c) => [
    (c.name as string) || '(untitled)',
    String(c.slug ?? '—'),
    c.active === false ? <Badge key="a" variant="warn">inactive</Badge> : <Badge key="a" variant="ok">active</Badge>,
  ]);
  return (
    <>
      <TopBar title="Categories" sub="Topics that organize offers, content and campaigns, scoped to your workspace." />
      <div className="adm-content">
        <div style={{ marginBottom: 16 }}>
          <ComingSoon>Category editing is managed by the BubbaAffiliate team for now. Your workspace starts with a clean slate; categories are created as your offer catalog grows.</ComingSoon>
        </div>
        <Card title={`${docs.length} categor${docs.length === 1 ? 'y' : 'ies'}`}>
          <DataTable head={['Name', 'Slug', 'Status']} rows={rows} empty="No categories yet." />
        </Card>
      </div>
    </>
  );
}
