import Link from 'next/link';
import { requireWorkspace } from '@/lib/workspace';
import {
  intakeOverview, listIntake, intakeSummary, KIND_LABELS, KIND_ROUTES, type IntakeKind,
} from '@/lib/bubbaaffiliate-intake';
import { TopBar, Section, Card, Stat, DataTable, StatusBadge, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 } as const;

async function recentTable(scope: Parameters<typeof listIntake>[0], kind: IntakeKind) {
  const docs = await listIntake(scope, kind, { limit: 6 });
  const base = KIND_ROUTES[kind];
  const rows = docs.map((d) => {
    const s = intakeSummary(d, kind);
    return [
      <Link key="n" href={`${base}/${s.id}`}>{s.name || s.email || '(no name)'}</Link>,
      s.entity || s.typeOrPlatform || '—',
      <StatusBadge key="s" status={s.status} />,
      fmtDate(s.createdAt),
    ];
  });
  return { rows, empty: `No ${KIND_LABELS[kind].plural.toLowerCase()} yet.` };
}

export default async function BubbaAffiliateCommandCenter() {
  const ws = await requireWorkspace();
  const [o, sellerRecent, creatorRecent] = await Promise.all([
    intakeOverview(ws.scope),
    recentTable(ws.scope, 'seller'),
    recentTable(ws.scope, 'creator'),
  ]);

  return (
    <>
      <TopBar
        title="BubbaAffiliate"
        sub="Internal command center for seller offer submissions and creator partner applications from the public gateway."
      />
      <div className="adm-content">
        <Section
          title="Seller submissions"
          action={<Link href={KIND_ROUTES.seller} className="adm-btn ghost">Open →</Link>}
        >
          <div style={statsGrid}>
            <Stat label="Total" value={o.seller.total} />
            <Stat label="New / untriaged" value={o.seller.new} tone={o.seller.new > 0 ? 'attn' : undefined} />
          </div>
        </Section>

        <Section
          title="Creator applications"
          action={<Link href={KIND_ROUTES.creator} className="adm-btn ghost">Open →</Link>}
        >
          <div style={statsGrid}>
            <Stat label="Total" value={o.creator.total} />
            <Stat label="New / untriaged" value={o.creator.new} tone={o.creator.new > 0 ? 'attn' : undefined} />
          </div>
        </Section>

        <Section title="Recent seller submissions" action={<Link href={KIND_ROUTES.seller} className="adm-btn ghost">All →</Link>}>
          <Card>
            <DataTable head={['Name', 'Business / offer', 'Status', 'Received']} rows={sellerRecent.rows} empty={sellerRecent.empty} />
          </Card>
        </Section>

        <Section title="Recent creator applications" action={<Link href={KIND_ROUTES.creator} className="adm-btn ghost">All →</Link>}>
          <Card>
            <DataTable head={['Name', 'Handle / platform', 'Status', 'Received']} rows={creatorRecent.rows} empty={creatorRecent.empty} />
          </Card>
        </Section>

        <Section title="About this data">
          <div className="adm-panel">
            These submissions come from the public BubbaAffiliate gateway intake and are stored in the existing
            Contact Messages collection (<code>source = bubbaaffiliate-seller</code> / <code>bubbaaffiliate-creator</code>).
            Triage uses the shared status field. No seller/creator accounts, commissions, or payouts are created here yet.
          </div>
        </Section>
      </div>
    </>
  );
}
