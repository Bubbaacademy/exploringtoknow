import { listActiveCategories } from '@/lib/public';
import { groupCategories, type NavCategory } from '@/lib/nav';
import { Brand } from './Brand';
import { SiteNav } from './SiteNav';

/**
 * Shared site header. Server component: loads the REAL active categories and
 * groups them for the Topics mega menu, then hands them to the interactive
 * <SiteNav> client component. Nav markup (links + categories) is server-rendered,
 * so navigation is never JS-only.
 */
export async function Header() {
  const categories = (await listActiveCategories()) as NavCategory[];
  const groups = groupCategories(
    categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  );

  return (
    <header className="site-header">
      <div className="container bar">
        <Brand />
        <SiteNav groups={groups} />
      </div>
    </header>
  );
}
