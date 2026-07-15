'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Group = { group: string; items: Array<[string, string]> };

/**
 * Workspace sidebar nav (client) — highlights the item matching the current
 * route. Active = the nav href that is the LONGEST segment-aware prefix of the
 * pathname, so:
 *   - `/app` (Command Center) never wins over a more specific route,
 *   - nested routes like `/app/bubbaaffiliate/seller-submissions/[id]` highlight
 *     their section (Seller Submissions), not the parent (Intake Overview),
 *   - sibling prefixes stay distinct (`/app/products` never matches
 *     `/app/product-requests`).
 */
function activeHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (pathname === href || pathname.startsWith(href + '/')) {
      if (best === null || href.length > best.length) best = href;
    }
  }
  return best;
}

export function SidebarNav({ nav }: { nav: Group[] }) {
  const pathname = usePathname();
  const active = activeHref(pathname, nav.flatMap((g) => g.items.map(([, href]) => href)));

  return (
    <nav className="adm-nav" aria-label="Workspace">
      {nav.map((g) => (
        <div key={g.group}>
          <div className="adm-nav-group">{g.group}</div>
          {g.items.map(([label, href]) => (
            <Link key={href} href={href} aria-current={href === active ? 'page' : undefined}>{label}</Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
