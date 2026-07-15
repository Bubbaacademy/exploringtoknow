import Link from 'next/link';
import { TopBar, Section, Card, DataTable, StatusBadge, fmtDate } from '../_ui';
import {
  listIntake, intakeSummary, KIND_LABELS, KIND_ROUTES, STATUS_FILTERS, type IntakeKind,
} from '@/lib/bubbaaffiliate-intake';
import type { WorkspaceScope } from '@/lib/workspace';

/**
 * Shared list + filter view for a BubbaAffiliate intake kind (seller | creator).
 * Filters (status, sort) are plain query-param links — server-rendered, no client
 * JS. Each row links to the detail/triage view. Workspace-scoped reads only.
 */

export async function SubmissionList({
  scope, kind, status, newestFirst,
}: { scope: WorkspaceScope; kind: IntakeKind; status: string; newestFirst: boolean }) {
  const docs = await listIntake(scope, kind, { status, newestFirst });
  const base = KIND_ROUTES[kind];
  const href = (s: string, nf: boolean) => `${base}?status=${s}${nf ? '' : '&sort=oldest'}`;
  const labels = KIND_LABELS[kind];

  const rows = docs.map((d) => {
    const s = intakeSummary(d, kind);
    return [
      <Link key="n" href={`${base}/${s.id}`}>{s.name || s.email || '(no name)'}</Link>,
      s.email || '—',
      s.entity || '—',
      s.typeOrPlatform || '—',
      <StatusBadge key="s" status={s.status} />,
      fmtDate(s.createdAt),
    ];
  });

  const chips = STATUS_FILTERS.map((f) => (
    <Link key={f.value} href={href(f.value, newestFirst)} className={`adm-btn${f.value === status ? '' : ' ghost'}`}>{f.label}</Link>
  ));
  const sortToggle = (
    <Link href={href(status, !newestFirst)} className="adm-btn ghost">{newestFirst ? 'Newest first ↓' : 'Oldest first ↑'}</Link>
  );
  const count = docs.length;

  return (
    <>
      <TopBar
        title={labels.plural}
        sub="From the BubbaAffiliate public gateway intake, stored in Contact Messages."
        actions={<Link href="/app/bubbaaffiliate" className="adm-btn ghost">← Command center</Link>}
      />
      <div className="adm-content">
        <Section
          title={`${count} ${count === 1 ? labels.singular.toLowerCase() : labels.plural.toLowerCase()}`}
          action={<div className="adm-quicklinks">{sortToggle}</div>}
        >
          <div className="adm-quicklinks" style={{ marginBottom: 12, flexWrap: 'wrap' }}>{chips}</div>
          <Card>
            <DataTable
              head={['Name', 'Email', kind === 'seller' ? 'Business / brand' : 'Handle', kind === 'seller' ? 'Offer type' : 'Platform', 'Status', 'Received']}
              rows={rows}
              empty={`No ${labels.plural.toLowerCase()} yet${status !== 'all' ? ` with status “${status}”` : ''}.`}
            />
          </Card>
        </Section>
      </div>
    </>
  );
}
