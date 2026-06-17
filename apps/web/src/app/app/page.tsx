import Link from 'next/link';
import { requireWorkspaceMember, getPrimaryTenant, getPrimaryWorkspace, getPrimaryMembership, getWorkspaceOverview, ROLE_LABEL, type Role } from '@/lib/tenant';
import { Section, Stat, Card, Empty } from '../dashboard/_components';

export const dynamic = 'force-dynamic';

const ONBOARDING_STEPS = [
  ['Add your first product', 'Describe the product you want to feature.'],
  ['Upload product images', 'Add your own permission-cleared photos.'],
  ['Choose a category', 'Pick where it fits in your publication.'],
  ['Submit for editorial review', 'Request an article — nothing is generated until you ask.'],
  ['Review the article draft', 'Read and edit before anything goes live.'],
  ['Publish when ready', 'You decide if and when it publishes.'],
] as const;

// Workspace overview + onboarding. Gated to authenticated users; all data is
// scoped server-side (tenant/workspace from the session, never the client).
export default async function AppHome() {
  const ctx = await requireWorkspaceMember();
  const tenant = getPrimaryTenant(ctx);

  if (!tenant) {
    return (
      <>
        <div className="adm-topbar">
          <h1>Workspace</h1>
          <span className="adm-sub">Your account isn’t linked to a workspace yet.</span>
        </div>
        <div className="adm-content">
          <Section title="No workspace assigned">
            <div className="adm-panel warn">Your account has no workspace membership. Please contact support to be added to a workspace.</div>
          </Section>
        </div>
      </>
    );
  }

  const workspace = getPrimaryWorkspace(ctx);
  const primary = getPrimaryMembership(ctx);
  const role = primary?.role as Role | undefined;
  const o = await getWorkspaceOverview(tenant.id, workspace?.id ?? null);

  const isTrial = String(tenant.status) === 'trial';
  const trialEnds = tenant.trialEndsAt ? new Date(String(tenant.trialEndsAt)) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : null;
  const isEmpty = o.products === 0 && o.published === 0 && o.drafts === 0 && o.review === 0;

  return (
    <>
      <div className="adm-topbar">
        <h1>Welcome{tenant.name ? `, ${String(tenant.name)}` : ''}</h1>
        <span className="adm-sub">
          {(workspace?.name as string) || 'Your workspace'} · {role ? ROLE_LABEL[role] : 'member'} · plan: {String(tenant.plan ?? 'free')}. Everything here is scoped to your workspace.
        </span>
      </div>
      <div className="adm-content">
        {isTrial ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            <strong>Free trial active.</strong>{' '}
            {daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.` : 'Trial in progress.'}{' '}
            No credit card required — billing isn’t enabled yet. You review and approve everything; nothing publishes automatically.
          </div>
        ) : null}

        {isEmpty ? (
          <Section title="Get your workspace ready">
            <Card title="Onboarding checklist">
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {ONBOARDING_STEPS.map(([title, desc], i) => (
                  <li key={title} className="adm-row">
                    <span className="t"><strong>{i + 1}. {title}</strong><br /><span className="adm-note">{desc}</span></span>
                  </li>
                ))}
              </ol>
              <p className="adm-note" style={{ marginTop: 10 }}>
                Workspace product &amp; article tools are being set up for your account. In the meantime, explore the live
                ExploringToKnow magazine to see the kind of content-commerce pages you’ll create — and read our editorial
                standards. Nothing is generated or published without your explicit approval.
              </p>
            </Card>
          </Section>
        ) : (
          <>
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
          </>
        )}

        <Section title="Your access">
          <Card title="Membership">
            {ctx.memberships.length ? ctx.memberships.map((m) => (
              <div key={String(m.id)} className="adm-row">
                <span className="t">{m.tenant?.name ? String(m.tenant.name) : 'Platform-wide'}{m.workspace?.name ? ` · ${String(m.workspace.name)}` : ''}</span>
                <strong>{ROLE_LABEL[m.role] ?? m.role.replace(/_/g, ' ')}</strong>
              </div>
            )) : <Empty>No memberships.</Empty>}
          </Card>
        </Section>

        <Section title="Quick links">
          <div className="adm-quicklinks">
            <Link className="adm-btn" href="/">View the live magazine</Link>
            <Link className="adm-btn ghost" href="/editorial-policy">Editorial standards</Link>
            {ctx.isSuperAdmin ? <Link className="adm-btn ghost" href="/dashboard">Editorial console</Link> : null}
            {ctx.isSuperAdmin ? <Link className="adm-btn ghost" href="/platform">Platform admin</Link> : null}
          </div>
        </Section>
      </div>
    </>
  );
}
