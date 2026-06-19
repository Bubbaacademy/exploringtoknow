import Link from 'next/link';

const TABS: Array<[string, string]> = [
  ['List', '/app/social-posts'],
  ['Board', '/app/social-posts/board'],
  ['Calendar', '/app/social-posts/calendar'],
  ['Export', '/app/social-posts/export'],
];

/** Sub-navigation across the Social Studio views. `active` is the href of the current tab. */
export function SocialNav({ active }: { active: string }) {
  return (
    <nav aria-label="Social Studio views" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {TABS.map(([label, href]) => (
        <Link key={href} href={href} className={`adm-btn${href === active ? '' : ' ghost'}`} aria-current={href === active ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  );
}

/** Compact Social Studio overview strip (status buckets + planning + export). */
export function SocialOverview({ o }: { o: { total: number; draft: number; ready: number; approved: number; archived: number; plannedThisWeek: number; exported: number } }) {
  const items: Array<[string, number]> = [
    ['Total', o.total], ['Draft', o.draft], ['Ready', o.ready], ['Approved', o.approved],
    ['Archived', o.archived], ['Planned (7d)', o.plannedThisWeek], ['Exported', o.exported],
  ];
  return (
    <div className="adm-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {items.map(([label, n]) => (
          <span key={label} style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: 20, lineHeight: 1.1 }}>{n}</strong>
            <span className="adm-note">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
