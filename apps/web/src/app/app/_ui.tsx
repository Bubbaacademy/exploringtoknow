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

/* ------------------------------------------------------------------ *
 * Editorial vocabulary (Phase 2G)
 *
 * Human labels for the EXISTING `Articles.editorialStatus` and `Articles.type`
 * option sets. These are presentation-only maps over values that already exist
 * in the collection — no new status is invented and no field is added.
 *
 * NOTE: `editorialStatus` has exactly four states — draft, ready_for_review,
 * published, rejected. There is deliberately NO "archived" state; nothing here
 * pretends otherwise.
 * ------------------------------------------------------------------ */

export const EDITORIAL_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  ready_for_review: 'In review',
  published: 'Published',
  rejected: 'Rejected',
};

export const ARTICLE_TYPE_LABEL: Record<string, string> = {
  how_to: 'How-To',
  buying_guide: 'Buying Guide',
  review: 'Review',
  comparison: 'Comparison',
  best_list: 'Best List',
  faq: 'FAQ',
  problem_solution: 'Problem / Solution',
  educational: 'Educational',
};

/** Editorial status badge using the human label, falling back to the raw value. */
export function EditorialStatusBadge({ status }: { status: string }) {
  const key = (status || '').toLowerCase();
  return <Badge variant={statusVariant(key)}>{EDITORIAL_STATUS_LABEL[key] ?? (status || '—').replace(/_/g, ' ')}</Badge>;
}

/**
 * Whether an article is actually visible on the public magazine. Public
 * visibility is gated SOLELY by editorialStatus === 'published' (mirrors
 * `PUBLISHED_WHERE` in lib/public.ts) — this badge reports that single source of
 * truth so an editor never has to infer it from a date column.
 */
export function PublicStateBadge({ status }: { status: string }) {
  const live = String(status || '').toLowerCase() === 'published';
  return <Badge variant={live ? 'ok' : ''}>{live ? 'Live' : 'Not public'}</Badge>;
}

export const refName = (rel: unknown): string => {
  if (rel && typeof rel === 'object') return String((rel as { name?: unknown; title?: unknown }).name ?? (rel as { title?: unknown }).title ?? '—');
  return rel == null ? '—' : String(rel);
};
