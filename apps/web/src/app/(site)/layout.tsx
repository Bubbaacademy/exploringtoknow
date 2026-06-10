import type { ReactNode } from 'react';

// Public content website shell (header/footer added in Phase 2 — Publishing).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}
