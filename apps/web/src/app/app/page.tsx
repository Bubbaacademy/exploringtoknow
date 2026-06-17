import { requireWorkspace } from '@/lib/workspace';
import { workspaceDashboard } from '@/lib/workspace';
import { ROLE_LABEL, type Role } from '@/lib/tenant';
import { canWrite } from '@/lib/roles';
import { TopBar, Section, Stat, Card, Empty, StatusBadge, WsLink, fmtDate } from './_ui';

export const dynamic = 'force-dynamic';

const ONBOARDING = [
  ['Add your first product', 'Describe a product you want to feature.'],
  ['Upload product images', 'Add your own permission-cleared photos.'],
  ['Choose a category', 'Place it in your publication.'],
  ['Submit for editorial review', 'Request an article — nothing generates until you ask.'],
  ['Review the article draft', 'Read and edit before anything goes live.'],
  ['Publish when ready', 'You decide if and when it publishes.'],
] as const;

const PIPELINE = ['Request', 'Product', 'Brief / Intelligence', 'Article draft', 'Editorial review', 'Published'] as const;

export default async function AppHome() {
  const ws = await requireWorkspace();

  if (!ws.tenant) {
    return (
      <>
        <TopBar title="Workspace" sub="Your account isn’t linked to a workspace yet." />
        <div className="adm-content">
          <Section title="No workspace assigned">
            <div className="adm-panel warn">Your account has no workspace membership. Please contact support to be added to a workspace.</div>
          </Section>
        </div>
      </>
    );
  }

  const d = await workspaceDashboard(ws.scope);
  const c = d.counts;
  const role = ws.role ? ROLE_LABEL[ws.role as Role] : 'Member';
  const isTrial = String(ws.tenant.status) === 'trial';
  const trialEnds = ws.tenant.trialEndsAt ? new Date(String(ws.tenant.trialEndsAt)) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : null;

  return (
    <>
      <TopBar
        title={`Welcome, ${String(ws.tenant.name)}`}
        sub={`${(ws.workspace?.name as string) || 'Your workspace'} · ${role} · plan: ${String(ws.tenant.plan ?? 'free')}. Everything here is scoped to your workspace.`}
        actions={<>{canWrite(ws.role) ? <WsLink href="/app/products/new" primary>Add a product</WsLink> : null}<WsLink href="/">View public site</WsLink></>}
      />
      <div className="adm-content">
        {isTrial ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            <strong>Free trial active.</strong>{' '}
            {daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.` : 'Trial in progress.'}{' '}
            No credit card required — billing isn’t enabled yet. You review and approve everything; nothing publishes automatically.
          </div>
        ) : null}

        <Section title="Workspace overview">
          <div className="adm-cols">
            <Stat label="Published" value={c.published} tone="good" />
            <Stat label="Ready for review" value={c.review} tone={c.review > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={c.drafts} />
            <Stat label="Products" value={c.products} />
            <Stat label="Categories" value={c.categories} />
            <Stat label="Product requests" value={c.requestsTotal} tone={c.requestsOpen > 0 ? 'attn' : undefined} />
            <Stat label="Subscribers" value={c.subsActive} />
            <Stat label="Contacts" value={c.contactsNew} tone={c.contactsNew > 0 ? 'attn' : undefined} />
            <Stat label="Media" value={c.media} />
            <Stat label="Views" value={c.viewRows} />
          </div>
        </Section>

        <Section title="Needs attention">
          {d.needs.length ? (
            <div className="adm-panel warn">
              {d.needs.map(([label, n]) => (
                <div key={label} className="adm-row"><span className="t">{label}</span><strong>{n}</strong></div>
              ))}
            </div>
          ) : (
            <div className="adm-panel ok">All clear — nothing needs your attention right now.</div>
          )}
        </Section>

        {d.isEmpty ? (
          <Section title="Set up your workspace">
            <Card title="Onboarding checklist">
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {ONBOARDING.map(([t, sub], i) => (
                  <li key={t} className="adm-row">
                    <span className="t"><strong>{i + 1}. {t}</strong><br /><span className="adm-note">{sub}</span></span>
                  </li>
                ))}
              </ol>
              <p className="adm-note" style={{ marginTop: 10 }}>
                Workspace product &amp; article tooling is being set up for your account. Explore the live magazine to see the
                kind of content-commerce pages you’ll create. Nothing is generated or published without your explicit approval.
              </p>
            </Card>
          </Section>
        ) : null}

        <Section title="Editorial pipeline">
          <div className="adm-panel">
            <div className="adm-quicklinks" aria-hidden="true">
              {PIPELINE.map((s, i) => (
                <span key={s} className="adm-badge">{i + 1}. {s}</span>
              ))}
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>
              Every step is manual and reviewed by you — a product request becomes a product, then a researched brief, then an
              article draft you review before publishing. Nothing auto-generates or auto-publishes.
            </p>
          </div>
        </Section>

        <Section title="Recent activity">
          <div className="adm-cols-2">
            <Card title="Recent articles">
              {d.recentArticles.length ? d.recentArticles.map((a) => (
                <div key={String(a.id)} className="adm-row"><span className="t">{(a.title as string) || '(untitled)'}</span><StatusBadge status={String(a.editorialStatus)} /></div>
              )) : <Empty>No articles yet.</Empty>}
            </Card>
            <Card title="Recent product requests">
              {d.recentRequests.length ? d.recentRequests.map((r) => (
                <div key={String(r.id)} className="adm-row"><span className="t">{(r.productName as string) || '(untitled)'}</span><StatusBadge status={String(r.status)} /></div>
              )) : <Empty>No product requests yet.</Empty>}
            </Card>
            <Card title="Recent contact messages">
              {d.recentContacts.length ? d.recentContacts.map((m) => (
                <div key={String(m.id)} className="adm-row"><span className="t">{(m.subject as string) || (m.reason as string) || 'message'} · {fmtDate(m.createdAt)}</span><StatusBadge status={String(m.status)} /></div>
              )) : <Empty>No messages yet.</Empty>}
            </Card>
          </div>
        </Section>

        <Section title="Quick links">
          <div className="adm-quicklinks">
            <WsLink href="/app/articles" primary>Manage articles</WsLink>
            <WsLink href="/app/product-requests">Product requests</WsLink>
            <WsLink href="/app/analytics">Analytics</WsLink>
            <WsLink href="/app/settings">Workspace settings</WsLink>
          </div>
        </Section>
      </div>
    </>
  );
}
