import Link from 'next/link';

const TABS: Array<[string, string]> = [
  ['Overview', '/app/performance'],
  ['New entry', '/app/performance/new'],
  ['Import CSV', '/app/performance/import'],
];

export function PerfNav({ active }: { active: string }) {
  return (
    <nav aria-label="Performance views" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {TABS.map(([label, href]) => (
        <Link key={href} href={href} className={`adm-btn${href === active ? '' : ' ghost'}`} aria-current={href === active ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  );
}

export function PerfDisclaimer() {
  return (
    <div className="adm-panel" style={{ marginBottom: 16 }}>
      <strong>Manual performance tracking.</strong> Metrics are calculated from manually entered or imported data —
      <strong> no ad accounts are connected yet</strong> and nothing is synced from platforms. Revenue/conversions are
      user-provided and not independently verified. No campaigns are launched from here.
    </div>
  );
}
