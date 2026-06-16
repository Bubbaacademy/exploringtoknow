import type { ReactNode } from 'react';
import Link from 'next/link';
import '../dashboard/dashboard.css';

// Platform super-admin console. Never indexable; gated server-side in each page
// via requireSuperAdmin().
export const metadata = { robots: { index: false, follow: false } };

const NAV: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: 'Platform', items: [['Overview', '/platform']] },
  { group: 'Accounts', items: [['Tenants', '/admin/collections/tenants'], ['Workspaces', '/admin/collections/workspaces'], ['Memberships', '/admin/collections/memberships']] },
  { group: 'People', items: [['Users', '/admin/collections/users']] },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            <span className="adm-brand-mark">P</span>
            <span><b>Platform</b><span>AI Commerce Media OS</span></span>
          </div>
          <nav className="adm-nav" aria-label="Platform">
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
            <Link href="/admin">Payload Admin →</Link>
            <Link href="/">View public site →</Link>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
