import { requireWorkspace } from '@/lib/workspace';
import { workspaceDashboard } from '@/lib/workspace';
import { ROLE_LABEL, type Role } from '@/lib/tenant';
import { canWrite, canManageTeam, canManageSettings } from '@/lib/roles';
import { TopBar, Section, Stat, Card, Empty, StatusBadge, WsLink, fmtDate } from './_ui';

export const dynamic = 'force-dynamic';

const ONBOARDING = [
  ['Submit your first offer', 'Describe a product or service to promote.'],
  ['Upload offer assets', 'Add permission-cleared photos and video.'],
  ['Choose a category', 'Classify the offer for matching and reporting.'],
  ['Send for review', 'BubbaAffiliate reviews before anything runs — nothing generates until you ask.'],
  ['Review the draft assets', 'Read and edit campaign assets before anything goes live.'],
  ['Publish when ready', 'You decide if and when it publishes.'],
] as const;

const PIPELINE = ['Seller intake', 'Offer', 'Brief / Intelligence', 'Campaign assets', 'Review', 'Published'] as const;

// Positioning: this is the internal operating system for a managed affiliate model — more surfaces come online per phase.
const ROADMAP = ['Offer pages', 'Creator assets', 'Short-form video', 'Ad campaigns', 'Attribution insights'] as const;

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
        sub={`${(ws.workspace?.name as string) || 'Your workspace'} · ${role} · plan: ${String(ws.tenant.plan ?? 'free')}. Your command center for offers, campaigns and reporting — scoped to your workspace.`}
        actions={<>{canWrite(ws.role) ? <WsLink href="/app/products/new" primary>Add an offer</WsLink> : null}<WsLink href="/">View public site</WsLink></>}
      />
      <div className="adm-content">
        {isTrial ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            <strong>Onboarding active.</strong>{' '}
            {daysLeft != null ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining in your onboarding window.` : 'Onboarding in progress.'}{' '}
            No payment required to get set up. You review and approve everything; nothing publishes or runs automatically.
          </div>
        ) : null}

        <Section title="Workspace overview">
          <div className="adm-cols">
            <Stat label="Published" value={c.published} tone="good" />
            <Stat label="Ready for review" value={c.review} tone={c.review > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={c.drafts} />
            <Stat label="Products" value={c.products} />
            <Stat label="Categories" value={c.categories} />
            <Stat label="Seller submissions" value={c.requestsTotal} tone={c.requestsOpen > 0 ? 'attn' : undefined} />
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
                Start by intaking an offer — then editorial content, offer pages, creator assets and campaigns follow through
                the managed pipeline. Explore the live ExploringToKnow magazine to see the publishing layer. Nothing is
                generated or published without explicit approval.
              </p>
            </Card>
          </Section>
        ) : null}

        <Section title="Campaign pipeline">
          <div className="adm-panel">
            <div className="adm-quicklinks" aria-hidden="true">
              {PIPELINE.map((s, i) => (
                <span key={s} className="adm-badge">{i + 1}. {s}</span>
              ))}
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>
              Every step is manual and reviewed — a seller submission becomes an offer, then a researched brief, then campaign
              assets you review before publishing. Nothing auto-generates or auto-publishes.
            </p>
          </div>
        </Section>

        <Section title="More from your workspace">
          <div className="adm-panel">
            <p style={{ margin: '0 0 8px' }}>This is the <strong>managed affiliate operating system</strong> — editorial is just the first surface.</p>
            <div className="adm-quicklinks" aria-hidden="true">
              {ROADMAP.map((s) => <span key={s} className="adm-badge">{s} · planned</span>)}
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>
              These surfaces are on the roadmap and aren’t available yet — your offers, assets and brand will power them when they ship. Everything is reviewed and approved before it publishes or runs.
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
            <Card title="Recent seller submissions">
              {d.recentRequests.length ? d.recentRequests.map((r) => (
                <div key={String(r.id)} className="adm-row"><span className="t">{(r.productName as string) || '(untitled)'}</span><StatusBadge status={String(r.status)} /></div>
              )) : <Empty>No seller submissions yet.</Empty>}
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
            {canWrite(ws.role) ? <WsLink href="/app/product-requests/new">New seller submission</WsLink> : null}
            <WsLink href="/app/analytics">Analytics</WsLink>
            {canManageTeam(ws.role) ? <WsLink href="/app/team">Invite team</WsLink> : null}
            {canManageSettings(ws.role) ? <WsLink href="/app/billing">Invoices & Payouts</WsLink> : null}
          </div>
        </Section>
      </div>
    </>
  );
}
