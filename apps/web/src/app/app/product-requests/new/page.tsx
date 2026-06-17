import { requireWorkspace } from '@/lib/workspace';
import { listActiveCategories } from '@/lib/public';
import { TopBar } from '../../_ui';
import { CreateProductForm } from '@/components/app/CreateProductForm';

export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  await requireWorkspace();
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
