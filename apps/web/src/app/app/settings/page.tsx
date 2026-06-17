import type { ReactNode } from 'react';
import { requireWorkspace } from '@/lib/workspace';
import { ROLE_LABEL, type Role } from '@/lib/tenant';
import { TopBar, Section, Card, Empty, ComingSoon, fmtDate } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const ws = await requireWorkspace();
  const t = ws.tenant;
  const w = ws.workspace;
  const row = (label: string, value: ReactNode) => (
    <div className="adm-row"><span className="t">{label}</span><strong>{value}</strong></div>
  );
  return (
    <>
      <TopBar title="Workspace settings" sub="Your account, workspace, and plan." />
      <div className="adm-content">
        <Section title="Business / account">
          <Card>
            {row('Business name', String(t?.name ?? '—'))}
            {row('Account slug', String(t?.slug ?? '—'))}
            {row('Status', String(t?.status ?? '—'))}
            {row('Contact email', String(t?.contactEmail ?? '—'))}
          </Card>
        </Section>
        <Section title="Workspace / publication">
          <Card>
            {row('Workspace name', String(w?.name ?? '—'))}
            {row('Workspace slug', String(w?.slug ?? '—'))}
            {row('Mode', String(w?.mode ?? '—').replace(/_/g, ' '))}
            {row('Custom domain', String(w?.primaryDomain ?? '— (not configured)'))}
          </Card>
        </Section>
        <Section title="Plan & trial">
          <Card>
            {row('Plan', String(t?.plan ?? 'free'))}
            {row('Trial started', fmtDate(t?.trialStartedAt))}
            {row('Trial ends', fmtDate(t?.trialEndsAt))}
          </Card>
          <div style={{ marginTop: 12 }}>
            <ComingSoon>Billing and paid plans aren’t enabled yet — your trial workspace is fully usable with no credit card.</ComingSoon>
          </div>
        </Section>
        <Section title="Team & members">
          <Card title="Members">
            {ws.ctx.memberships.length ? ws.ctx.memberships.map((m) => (
              <div key={String(m.id)} className="adm-row">
                <span className="t">{ws.ctx.user?.email ? String(ws.ctx.user.email) : 'You'}</span>
                <strong>{ROLE_LABEL[m.role as Role] ?? m.role}</strong>
              </div>
            )) : <Empty>No members.</Empty>}
          </Card>
          <div style={{ marginTop: 12 }}>
            <ComingSoon>Inviting teammates is coming next. Today your workspace has a single owner.</ComingSoon>
          </div>
        </Section>
      </div>
    </>
  );
}
