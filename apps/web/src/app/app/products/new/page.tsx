import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listActiveCategories } from '@/lib/public';
import { TopBar } from '../../_ui';
import { CreateProductForm } from '@/components/app/CreateProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (
      <>
        <TopBar title="Add an offer" sub="Your role has read-only access." />
        <div className="adm-content"><div className="adm-panel warn">Your role can view this workspace but can’t create offers. Ask a workspace owner or admin if you need edit access.</div></div>
      </>
    );
  }
  const categories = (await listActiveCategories())
    .map((c) => ({ id: c.id, name: c.name as string, slug: c.slug as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <TopBar title="Add an offer" sub="Submit a product or service offer. BubbaAffiliate reviews it before it enters a campaign — nothing runs automatically." />
      <div className="adm-content">
        <CreateProductForm categories={categories} submitLabel="Submit offer for review" />
      </div>
    </>
  );
}
