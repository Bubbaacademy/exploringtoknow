import { requireWorkspace } from '@/lib/workspace';
import { canManageSettings } from '@/lib/roles';
import { getTenantPlan, getWorkspaceUsage, billingLive, stripeConfigured } from '@/lib/billing';
import { SELECTABLE_PLANS, limitText } from '@/lib/plans';
import { TopBar, Section, Card } from '../_ui';
import { BillingClient } from '@/components/app/BillingClient';

export const dynamic = 'force-dynamic';

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit == null ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const tone = limit != null && used >= limit ? 'var(--a-err-fg)' : limit != null && pct >= 80 ? 'var(--a-warn-fg)' : 'var(--a-brand)';
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="adm-row" style={{ borderBottom: 0, padding: '2px 0' }}><span className="t">{label}</span><strong>{used} / {limitText(limit)}</strong></div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--a-line)', overflow: 'hidden' }}>
        <div style={{ width: `${limit == null ? 6 : pct}%`, height: '100%', background: tone, opacity: limit == null ? 0.35 : 1 }} />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const ws = await requireWorkspace();
  if (!canManageSettings(ws.role)) {
    return (
      <>
        <TopBar title="Billing" sub="Owner only." />
        <div className="adm-content"><div className="adm-panel warn">Only the workspace owner can view and manage billing.</div></div>
      </>
    );
  }

  const tp = getTenantPlan(ws.tenant);
  const usage = await getWorkspaceUsage(ws.scope);
  const daysLeft = tp.trialEndsAt ? Math.max(0, Math.ceil((tp.trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  const providerActive = billingLive();

  return (
    <>
      <TopBar title="Billing & plan" sub={`${(ws.tenant?.name as string) || 'Your account'} · plan: ${tp.plan.label} · status: ${tp.status}`} />
      <div className="adm-content">
        {tp.trialExpired ? (
          <div className="adm-panel warn" style={{ marginBottom: 16 }}>
            <strong>Your free trial has ended.</strong> Your data is safe and readable, but creating new requests, uploads, or invites is paused. Upgrade below to continue.
          </div>
        ) : tp.status === 'trialing' && daysLeft != null ? (
          <div className="adm-panel" style={{ marginBottom: 16 }}>
            <strong>Free trial.</strong> {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining — no credit card required.
          </div>
        ) : null}

        <Section title="Current usage">
          <Card>
            <Meter label="Product / article requests (this month)" used={usage.requestsThisMonth} limit={tp.limits.requestsPerMonth} />
            <Meter label="Media uploads" used={usage.mediaCount} limit={tp.limits.mediaUploads} />
            <Meter label="Team members" used={usage.memberCount + usage.pendingInvites} limit={tp.limits.teamMembers} />
            <div className="adm-row"><span className="t">Published articles</span><strong>{usage.published}</strong></div>
            <div className="adm-row"><span className="t">Drafts · ready for review</span><strong>{usage.drafts} · {usage.ready}</strong></div>
          </Card>
        </Section>

        <Section title="Plans">
          {!providerActive ? (
            <div className="adm-panel" style={{ marginBottom: 12 }}>
              Online checkout isn’t active in this environment yet (payment provider <strong>{stripeConfigured() ? 'present' : 'not configured'}</strong>). Plans and limits are live now; the “Upgrade” buttons will open checkout once billing is enabled — until then they show a clear notice.
            </div>
          ) : null}
          <BillingClient plans={SELECTABLE_PLANS} currentPlanId={tp.planId} />
        </Section>
      </div>
    </>
  );
}
