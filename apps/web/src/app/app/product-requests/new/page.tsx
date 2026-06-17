import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listActiveCategories } from '@/lib/public';
import { TopBar } from '../../_ui';
import { CreateProductForm } from '@/components/app/CreateProductForm';

export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (
      <>
        <TopBar title="Request an article" sub="Your role has read-only access." />
        <div className="adm-content"><div className="adm-panel warn">Your role can view this workspace but can’t submit requests. Ask a workspace owner or admin if you need edit access.</div></div>
      </>
    );
  }
  const categories = (await listActiveCategories())
    .map((c) => ({ id: c.id, name: c.name as string, slug: c.slug as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <TopBar title="Request an article" sub="Tell us about a product and we’ll create a reviewed article for it. Every request is read by an editor — nothing is generated or published automatically." />
      <div className="adm-content">
        <CreateProductForm categories={categories} submitLabel="Submit request" />
      </div>
    </>
  );
}
