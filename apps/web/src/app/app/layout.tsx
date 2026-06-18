import type { ReactNode } from 'react';
import Link from 'next/link';
import '../dashboard/dashboard.css';
import { requireWorkspace } from '@/lib/workspace';
import { canManageSettings } from '@/lib/roles';
import { ROLE_LABEL, type Role } from '@/lib/tenant';

// Workspace console (the customer SaaS surface). Never indexable; gated server-side.
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Workspace-safe navigation — every link stays under /app (never Payload /admin).
const NAV: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: 'Overview', items: [['Dashboard', '/app']] },
  { group: 'Content', items: [['Articles', '/app/articles'], ['Products', '/app/products'], ['Categories', '/app/categories'], ['Media', '/app/media'], ['Brand Kit', '/app/brand']] },
  { group: 'Workflow', items: [['Product Requests', '/app/product-requests'], ['Editorial Console', '/app/editorial']] },
  { group: 'Growth', items: [['Analytics', '/app/analytics'], ['Newsletter', '/app/newsletter'], ['Contact Inbox', '/app/contact']] },
  { group: 'Workspace', items: [['Team', '/app/team'], ['Settings', '/app/settings']] },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ws = await requireWorkspace();
  const wsName = (ws.workspace?.name as string) || (ws.tenant?.name as string) || 'Workspace';
  const roleLabel = ws.role ? ROLE_LABEL[ws.role as Role] : 'Member';
  // Billing is owner-only.
  const nav = NAV.map((g) =>
    g.group === 'Workspace' && canManageSettings(ws.role)
      ? { ...g, items: [['Team', '/app/team'], ['Billing', '/app/billing'], ['Settings', '/app/settings']] as Array<[string, string]> }
      : g,
  );

  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            <span className="adm-brand-mark">{wsName.trim().charAt(0).toUpperCase() || 'W'}</span>
            <span><b>{wsName}</b><span>{roleLabel}</span></span>
          </div>
          <nav className="adm-nav" aria-label="Workspace">
            {nav.map((g) => (
              <div key={g.group}>
                <div className="adm-nav-group">{g.group}</div>
                {g.items.map(([label, href]) => (
                  <Link key={href} href={href}>{label}</Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="adm-side-foot">
            {/* Workspace console footer is intentionally minimal — Sign out only.
                Operator/super-admin surfaces (/platform, /dashboard, /admin) keep
                their routes + gates but are NOT promoted inside the workspace UI. */}
            <a href="/api/auth/logout">Sign out →</a>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
