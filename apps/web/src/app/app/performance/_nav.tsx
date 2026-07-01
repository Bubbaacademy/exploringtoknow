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
      <strong>Unified performance.</strong> Manual entries are a fallback / onboarding layer (user-provided, not
      independently verified). Connected ad accounts sync <strong>read-only</strong> API metrics, labeled
      {' '}<code>api_synced</code> and shown separately by provider. No campaigns are launched and no budgets are changed
      from here.
    </div>
  );
}
