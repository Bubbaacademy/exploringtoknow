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
      <TopBar title="Categories" sub="The topics that organize the magazine. Every published article needs one — it drives the article's section and its public /category page." />
      <div className="adm-content">
        <div style={{ marginBottom: 16 }}>
          <ComingSoon>Categories are created and edited in Payload <b>/admin</b>. Only <b>active</b> categories appear in public topic menus, and a category page stays empty until an article in it is published.</ComingSoon>
        </div>
        <Card title={`${docs.length} categor${docs.length === 1 ? 'y' : 'ies'}`}>
          <DataTable
            head={['Name', 'Slug', 'Status']}
            rows={rows}
            empty="No categories yet. Categories are created in Payload /admin — an article cannot be published without one."
          />
        </Card>
      </div>
    </>
  );
}
