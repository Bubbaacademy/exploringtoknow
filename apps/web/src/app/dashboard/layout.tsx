import type { ReactNode } from 'react';
import Link from 'next/link';

const NAV: Array<[string, string]> = [
  ['Products', '/dashboard/products'], ['Content', '/dashboard/content'], ['Social', '/dashboard/social'],
  ['Tracking', '/dashboard/tracking'], ['Analytics', '/dashboard/analytics'], ['System Health', '/dashboard/health'],
];

// Internal command center shell. Auth is enforced in middleware.ts.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <aside style={{ width: 220, background: '#1F2A66', color: '#fff', padding: 20 }}>
        <strong>ExploringToKnow</strong>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Command Center</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} style={{ color: '#fff', fontSize: 14 }}>{label}</Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
