import { cookies } from 'next/headers';
import { listActiveCategories } from '@/lib/public';
import { groupCategories, type NavCategory } from '@/lib/nav';
import { signupEnabled } from '@/lib/onboarding';
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

  // Auth state for the header is a presence check only (UX) — every gated route
  // still verifies the session server-side. We deliberately don't resolve role
  // here, so a "My Workspace" link points at /app, which gates/redirects correctly.
  const authed = Boolean((await cookies()).get('payload-token')?.value);
  const signupOn = signupEnabled();

  return (
    <header className="site-header">
      <div className="container bar">
        <Brand />
        <SiteNav groups={groups} authed={authed} signupEnabled={signupOn} />
      </div>
    </header>
  );
}
