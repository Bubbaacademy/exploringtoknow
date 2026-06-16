import Link from 'next/link';
import { requireSuperAdmin, getPlatformOverview } from '@/lib/tenant';
import { Section, Stat, Card, Empty, Badge } from '../dashboard/_components';

export const dynamic = 'force-dynamic';

// Platform super-admin overview across ALL tenants. Gated to platform super admins
// (verified server-side via the session + memberships).
export default async function PlatformHome() {
  await requireSuperAdmin();
  const { totals, tenants } = await getPlatformOverview();

  return (
    <>
      <div className="adm-topbar">
        <h1>Platform overview</h1>
        <span className="adm-sub">Owned Media AI OS · all tenants. ExploringToKnow is tenant #1 (the live magazine).</span>
      </div>
      <div className="adm-content">
        <Section title="Platform totals">
          <div className="adm-cols">
            <Stat label="Tenants" value={totals.tenants} />
            <Stat label="Workspaces" value={totals.workspaces} />
            <Stat label="Memberships" value={totals.memberships} />
            <Stat label="Users" value={totals.users} />
            <Stat label="Articles" value={totals.articles} />
            <Stat label="Products" value={totals.products} />
          </div>
        </Section>

        <Section title="Tenants">
          <Card>
            {tenants.length ? tenants.map((t) => (
              <div key={String(t.id)} className="adm-row">
                <span className="t">
                  <strong>{t.name}</strong>{' '}
                  <span className="adm-note">/{t.slug}</span>{' '}
                  <Badge variant={t.status === 'active' ? 'ok' : 'warn'}>{t.status || '—'}</Badge>{' '}
                  <Badge variant="info">{t.plan || 'free'}</Badge>
                </span>
                <span className="adm-note">{t.workspaces} workspace{t.workspaces === 1 ? '' : 's'} · {t.published} published · {t.products} products</span>
              </div>
            )) : <Empty>No tenants yet.</Empty>}
          </Card>
        </Section>

        <Section title="Manage">
          <div className="adm-quicklinks">
            <Link className="adm-btn" href="/admin/collections/tenants">Tenants</Link>
            <Link className="adm-btn ghost" href="/admin/collections/workspaces">Workspaces</Link>
            <Link className="adm-btn ghost" href="/admin/collections/memberships">Memberships</Link>
            <Link className="adm-btn ghost" href="/app">Workspace console</Link>
          </div>
        </Section>
      </div>
    </>
  );
}
