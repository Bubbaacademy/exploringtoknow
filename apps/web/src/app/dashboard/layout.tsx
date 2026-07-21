import type { ReactNode } from 'react';
import Link from 'next/link';
import './dashboard.css';
import { requireSuperAdmin } from '@/lib/tenant';

// Internal command center — never indexable. This console shows ETK editorial data
// across the workspace, so it is gated to platform super admins server-side (workspace
// customers are redirected to /app). Middleware also blocks unauthenticated access.
export const metadata = { robots: { index: false, follow: false } };
// Auth-gated (reads the session) → never prerender any /dashboard/* page at build.
export const dynamic = 'force-dynamic';

const NAV: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: 'Overview', items: [['Dashboard', '/dashboard'], ['Editorial Ops', '/dashboard/content']] },
  { group: 'Insights', items: [['Analytics', '/dashboard/analytics'], ['System Health', '/dashboard/health']] },
  { group: 'Editorial', items: [['Articles', '/admin/collections/articles'], ['Authors', '/admin/collections/authors'], ['Categories', '/admin/collections/categories']] },
  { group: 'Intake', items: [['Product Requests', '/admin/collections/product-requests'], ['Contact Inbox', '/admin/collections/contact-messages'], ['Newsletter', '/admin/collections/newsletter-subscribers']] },
  { group: 'Pipeline', items: [['Products', '/admin/collections/products'], ['Generation Runs', '/admin/collections/generation-runs']] },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            <span className="adm-brand-mark">E</span>
            <span><b>ExploringToKnow</b><span>Editorial Ops</span></span>
          </div>
          <nav className="adm-nav" aria-label="Admin">
            {NAV.map((g) => (
              <div key={g.group}>
                <div className="adm-nav-group">{g.group}</div>
                {g.items.map(([label, href]) => (
                  <Link key={href} href={href}>{label}</Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="adm-side-foot">
            <Link href="/app">Workspace console →</Link>
            <Link href="/platform">Platform admin →</Link>
            <Link href="/admin">Payload Admin (CMS) →</Link>
            <Link href="/">View public site →</Link>
            <a href="/api/auth/logout">Sign out →</a>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
