import Link from 'next/link';
import { requireSuperAdmin, getPlatformOverview, getScopingHealth } from '@/lib/tenant';
import { Section, Stat, Card, Empty, Badge } from '../dashboard/_components';

export const dynamic = 'force-dynamic';

// Platform super-admin overview across ALL tenants. Gated to platform super admins
// (verified server-side via the session + memberships).
export default async function PlatformHome() {
  await requireSuperAdmin();
  const { totals, tenants } = await getPlatformOverview();
  const health = await getScopingHealth();

  return (
    <>
      <div className="adm-topbar">
        <h1>Platform overview</h1>
        <span className="adm-sub">Owned Media AI OS · all tenants. ExploringToKnow is tenant #1 (the live magazine).</span>
      </div>
      <div className="adm-content">
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          This is the platform super-admin control center. Deep CMS editing lives in Payload <strong>/admin</strong> (super-admin-only); customer/workspace operators use <strong>/app</strong>; ExploringToKnow editorial uses <strong>/dashboard</strong>.
        </div>

        <Section title="Tenant isolation health">
          {health.ok ? (
            <div className="adm-panel ok">All operational records carry a tenant and a workspace — no unscoped rows detected.</div>
          ) : (
            <div className="adm-panel warn">
              <strong>⚠ Unscoped records detected — investigate.</strong>
              {health.problems.map((p) => (
                <div key={p.collection} className="adm-row"><span className="t">{p.collection}</span><strong>{p.nullTenant} no-tenant · {p.nullWorkspace} no-workspace</strong></div>
              ))}
            </div>
          )}
        </Section>

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
