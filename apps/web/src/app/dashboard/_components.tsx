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
