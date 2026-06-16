import Link from 'next/link';
import { requireWorkspaceMember, getPrimaryTenant, getPrimaryWorkspace, getPrimaryMembership, getWorkspaceOverview, ROLE_LABEL, type Role } from '@/lib/tenant';
import { Section, Stat, Card, Empty } from '../dashboard/_components';

export const dynamic = 'force-dynamic';

// Workspace overview. Gated to authenticated workspace members; all data is
// tenant-scoped server-side (the tenant id comes from the session, never the client).
export default async function AppHome() {
  const ctx = await requireWorkspaceMember();
  const tenant = getPrimaryTenant(ctx);

  if (!tenant) {
    return (
      <>
        <div className="adm-topbar">
          <h1>Workspace</h1>
          <span className="adm-sub">Your account is not linked to a tenant yet.</span>
        </div>
        <div className="adm-content">
          <Section title="No workspace assigned">
            <div className="adm-panel warn">Ask a platform administrator to add you to a workspace.</div>
          </Section>
        </div>
      </>
    );
  }

  const workspace = getPrimaryWorkspace(ctx);
  const primary = getPrimaryMembership(ctx);
  const role = primary?.role as Role | undefined;
  const o = await getWorkspaceOverview(tenant.id, workspace?.id ?? null);

  return (
    <>
      <div className="adm-topbar">
        <h1>{(workspace?.name as string) || (tenant.name as string) || 'Workspace'}</h1>
        <span className="adm-sub">
          {(tenant.name as string) || 'Tenant'} · {role ? ROLE_LABEL[role] : 'member'} · plan: {String(tenant.plan ?? 'free')} · status: {String(tenant.status ?? 'active')}. Every figure below is scoped to this workspace on the server.
        </span>
      </div>
      <div className="adm-content">
        <div className="adm-panel" style={{ marginBottom: 16 }}>
          Customer workspace operations live here in <strong>/app</strong>. Payload <strong>/admin</strong> is the internal CMS (platform staff only). Nothing on this page triggers content generation, approval, or publishing.
        </div>
        <Section title="Content">
          <div className="adm-cols">
            <Stat label="Published" value={o.published} tone="good" />
            <Stat label="Ready for review" value={o.review} tone={o.review > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={o.drafts} />
            <Stat label="Products" value={o.products} />
            <Stat label="Categories" value={o.categories} />
            <Stat label="Authors" value={o.authors} />
          </div>
        </Section>

        <Section title="Audience & intake">
          <div className="adm-cols">
            <Stat label="Requests waiting" value={o.requestsOpen} tone={o.requestsOpen > 0 ? 'attn' : undefined} />
            <Stat label="New contacts" value={o.contactsNew} tone={o.contactsNew > 0 ? 'attn' : undefined} />
            <Stat label="Active subscribers" value={o.subsActive} />
            <Stat label="View records" value={o.viewRows} />
          </div>
        </Section>

        <Section title="Your access">
          <Card title="Memberships">
            {ctx.memberships.length ? ctx.memberships.map((m) => (
              <div key={String(m.id)} className="adm-row">
                <span className="t">{m.tenant?.name ? String(m.tenant.name) : 'Platform-wide'}{m.workspace?.name ? ` · ${String(m.workspace.name)}` : ''}</span>
                <strong>{m.role.replace(/_/g, ' ')}</strong>
              </div>
            )) : <Empty>No memberships.</Empty>}
          </Card>
        </Section>

        <Section title="Quick links">
          <div className="adm-quicklinks">
            <Link className="adm-btn" href="/dashboard">Editorial console</Link>
            <Link className="adm-btn ghost" href="/dashboard/analytics">Analytics</Link>
            <Link className="adm-btn ghost" href="/admin/collections/articles">Manage articles</Link>
            {ctx.isSuperAdmin ? <Link className="adm-btn ghost" href="/platform">Platform admin</Link> : null}
          </div>
        </Section>
      </div>
    </>
  );
}
