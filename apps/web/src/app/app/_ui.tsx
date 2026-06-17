import type { ReactNode } from 'react';
import Link from 'next/link';
import { Section, Stat, Card, Empty, Badge, StatusBadge, statusVariant, TrendBars } from '../dashboard/_components';

// Reuse the premium admin-console design layer (.adm-*) shared with /dashboard.
export { Section, Stat, Card, Empty, Badge, StatusBadge, statusVariant, TrendBars };

/** Page header bar (title + sub + optional actions), styled like the console topbar. */
export function TopBar({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="adm-topbar">
      <div>
        <h1>{title}</h1>
        {sub ? <span className="adm-sub">{sub}</span> : null}
      </div>
      {actions ? <div className="adm-quicklinks">{actions}</div> : null}
    </div>
  );
}

/** Simple scoped data table with an honest empty state. */
export function DataTable({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="adm-table">
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Polished "set up / coming next" state for actions not yet wired for self-serve. */
export function ComingSoon({ children }: { children: ReactNode }) {
  return <div className="adm-panel"><strong>Setup in progress.</strong> {children}</div>;
}

export function WsLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return <Link href={href} className={`adm-btn${primary ? '' : ' ghost'}`}>{children}</Link>;
}

export function fmtDate(v: unknown): string {
  if (!v) return '—';
  try { return new Date(String(v)).toISOString().slice(0, 10); } catch { return '—'; }
}

export const refName = (rel: unknown): string => {
  if (rel && typeof rel === 'object') return String((rel as { name?: unknown; title?: unknown }).name ?? (rel as { title?: unknown }).title ?? '—');
  return rel == null ? '—' : String(rel);
};
