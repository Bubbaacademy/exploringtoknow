import type { ReactNode } from 'react';

/** Map a status string to a badge variant (presentation only). */
export function statusVariant(status: string): 'ok' | 'warn' | 'err' | 'info' | '' {
  const s = (status || '').toLowerCase();
  if (['published', 'active', 'passed', 'completed', 'sent'].includes(s)) return 'ok';
  if (['ready_for_review', 'pending', 'processing', 'running', 'new', 'submitted', 'approved'].includes(s)) return 'info';
  if (['draft', 'archived', 'subscribed', 'reviewed', 'local_no_send'].includes(s)) return 'warn';
  if (['flagged', 'failed', 'rejected', 'bounced', 'complained', 'spam'].includes(s)) return 'err';
  return '';
}

export function Badge({ children, variant }: { children: ReactNode; variant?: 'ok' | 'warn' | 'err' | 'info' | '' }) {
  return <span className={`adm-badge ${variant ?? ''}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{(status || '—').replace(/_/g, ' ')}</Badge>;
}

/* ------------------------------------------------------------------ *
 * Editorial vocabulary
 *
 * Human labels for the EXISTING `Articles.editorialStatus` and `Articles.type`
 * option sets. Presentation-only maps over values that already exist in the
 * collection — no new status is invented and no field is added.
 *
 * NOTE: `editorialStatus` has exactly four states — draft, ready_for_review,
 * published, rejected. There is deliberately NO "archived" state; nothing here
 * pretends otherwise.
 *
 * Defined here (the shared admin design layer) so both `/dashboard` and the
 * `/app` console read from one source of truth; `app/_ui.tsx` re-exports these.
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

export function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'attn' | 'good' }) {
  return (
    <div className={`adm-stat ${tone ?? ''}`}>
      <div className="n">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="adm-section">
      <div className="adm-section-head">
        <h2>{title}</h2>
        {action ?? null}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="adm-card">
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="adm-empty">{children}</p>;
}

export function TrendBars({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const allZero = data.every((d) => d.count === 0);
  return (
    <>
      <div className="adm-trend">
        {data.map((d) => (
          <div key={d.date} className="bar" title={`${d.date}: ${d.count}`}>
            <i style={{ height: `${Math.round((d.count / max) * 80)}px`, minHeight: d.count > 0 ? 3 : 0 }} />
            <span>{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
      {allZero ? <p className="adm-note" style={{ marginTop: 6 }}>No views recorded in this window yet.</p> : null}
    </>
  );
}
