import type { ReactNode } from 'react';
import '../dashboard/dashboard.css';
import { SidebarNav } from './_nav';
import { requireWorkspace } from '@/lib/workspace';
import { canManageSettings } from '@/lib/roles';
import { ROLE_LABEL, type Role } from '@/lib/tenant';

// Workspace console (the BubbaAffiliate managed-operations surface, not a public SaaS product). Never indexable; gated server-side.
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Workspace-safe navigation — every link stays under /app (never Payload /admin).
const NAV: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: 'Overview', items: [['Command Center', '/app']] },
  { group: 'Offers & Content', items: [['Offers', '/app/products'], ['Articles', '/app/articles'], ['Categories', '/app/categories'], ['Media', '/app/media'], ['Brand Kit', '/app/brand'], ['Offer Pages', '/app/landing-pages'], ['Creator Studio', '/app/social-posts']] },
  { group: 'Workflow', items: [['Seller Intake', '/app/product-requests'], ['Editorial', '/app/editorial']] },
  { group: 'BubbaAffiliate', items: [['Intake Overview', '/app/bubbaaffiliate'], ['Seller Submissions', '/app/bubbaaffiliate/seller-submissions'], ['Creator Applications', '/app/bubbaaffiliate/creator-applications']] },
  { group: 'Attribution & Growth', items: [['Ads Studio', '/app/ads'], ['Attribution & Reports', '/app/performance'], ['Connections', '/app/provider-connections'], ['Analytics', '/app/analytics'], ['Newsletter', '/app/newsletter'], ['Contact Inbox', '/app/contact']] },
  { group: 'Workspace', items: [['Team', '/app/team'], ['Settings', '/app/settings']] },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ws = await requireWorkspace();
  const wsName = (ws.workspace?.name as string) || (ws.tenant?.name as string) || 'Workspace';
  const roleLabel = ws.role ? ROLE_LABEL[ws.role as Role] : 'Member';
  // Billing is owner-only.
  const nav = NAV.map((g) =>
    g.group === 'Workspace' && canManageSettings(ws.role)
      ? { ...g, items: [['Team', '/app/team'], ['Invoices & Payouts', '/app/billing'], ['Settings', '/app/settings']] as Array<[string, string]> }
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
          <SidebarNav nav={nav} />
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
