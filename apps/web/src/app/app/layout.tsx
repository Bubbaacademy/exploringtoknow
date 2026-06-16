import type { ReactNode } from 'react';
import Link from 'next/link';
import '../dashboard/dashboard.css';

// Workspace console (SaaS tenant surface). Never indexable; gated server-side in
// each page via requireWorkspaceMember().
export const metadata = { robots: { index: false, follow: false } };

const NAV: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: 'Workspace', items: [['Overview', '/app']] },
  { group: 'Editorial', items: [['Editorial console', '/dashboard'], ['Analytics', '/dashboard/analytics']] },
  { group: 'Manage', items: [['Articles', '/admin/collections/articles'], ['Products', '/admin/collections/products'], ['Categories', '/admin/collections/categories']] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            <span className="adm-brand-mark">W</span>
            <span><b>Workspace</b><span>Owned Media OS</span></span>
          </div>
          <nav className="adm-nav" aria-label="Workspace">
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
            <Link href="/platform">Platform admin →</Link>
            <Link href="/admin">Payload Admin →</Link>
            <Link href="/">View public site →</Link>
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
