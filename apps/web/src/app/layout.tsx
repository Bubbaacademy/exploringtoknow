import type { ReactNode } from 'react';

export const metadata = {
  title: 'ExploringToKnow',
  description: 'Autonomous Affiliate & Commerce Content Engine — internal',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
