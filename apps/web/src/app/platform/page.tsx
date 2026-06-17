import Link from 'next/link';
import { requireSuperAdmin, getPlatformOverview, getScopingHealth, getRecentSignups } from '@/lib/tenant';
import { signupEnabled, freeTrialDays } from '@/lib/onboarding';
import { getBillingOverview } from '@/lib/billing';
import { Section, Stat, Card, Empty, Badge } from '../dashboard/_components';

export const dynamic = 'force-dynamic';

// Platform super-admin overview across ALL tenants. Gated to platform super admins
// (verified server-side via the session + memberships).
export default async function PlatformHome() {
  await requireSuperAdmin();
  const { totals, tenants } = await getPlatformOverview();
  const health = await getScopingHealth();
  const signups = await getRecentSignups(12);
  const signupOn = signupEnabled();
  const trialDays = freeTrialDays();
  const onboardingErrors = signups.filter((s) => s.missingWorkspace || s.missingOwner);
  const billing = await getBillingOverview();

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

        <Section title="Billing & plans">
          <div className="adm-panel" style={{ marginBottom: 12 }}>
            Payment provider: <strong>{billing.provider}</strong> · Stripe secret <strong>{billing.stripePresent ? 'present' : 'not configured'}</strong> · online billing <strong>{billing.providerActive ? 'ACTIVE' : 'local-safe (off)'}</strong>. No secret values are shown.
          </div>
          <div className="adm-cols">
            <Stat label="Tenants" value={billing.total} />
            <Stat label="Trialing" value={billing.trialing} tone={billing.trialing > 0 ? 'attn' : undefined} />
            <Stat label="Active (paid)" value={billing.active} tone="good" />
            <Stat label="Past due" value={billing.pastDue} tone={billing.pastDue > 0 ? 'attn' : undefined} />
            <Stat label="Canceled" value={billing.canceled} />
            <Stat label="Comped" value={billing.comped} />
          </div>
        </Section>

        <Section title="Signups & onboarding">
          <div className="adm-panel" style={{ marginBottom: 12 }}>
            Public signup is <strong>{signupOn ? 'ENABLED' : 'disabled'}</strong> (env <code>PUBLIC_SIGNUP_ENABLED</code>) ·
            free trial <strong>{trialDays} days</strong>. {signupOn ? 'New businesses can self-serve at /signup.' : 'The /signup page shows an early-access state; flip the env flag to open it.'}
          </div>
          {onboardingErrors.length ? (
            <div className="adm-panel warn" style={{ marginBottom: 12 }}>
              <strong>⚠ Onboarding errors — tenants missing a workspace or owner:</strong>
              {onboardingErrors.map((s) => (
                <div key={String(s.id)} className="adm-row"><span className="t">{s.name} /{s.slug}</span><strong>{[s.missingWorkspace ? 'no workspace' : '', s.missingOwner ? 'no owner' : ''].filter(Boolean).join(' · ')}</strong></div>
              ))}
            </div>
          ) : null}
          <Card title="Recent signups">
            {signups.length ? signups.map((s) => (
              <div key={String(s.id)} className="adm-row">
                <span className="t">
                  <strong>{s.name}</strong>{' '}
                  <span className="adm-note">/{s.slug}{s.workspaceName ? ` · ${s.workspaceName}` : ''}{s.ownerEmail ? ` · ${s.ownerEmail}` : ''}</span>{' '}
                  <Badge variant={s.status === 'active' ? 'ok' : s.status === 'trial' ? 'info' : 'warn'}>{s.status || '—'}</Badge>{' '}
                  {s.onboardingStatus ? <Badge variant="">{s.onboardingStatus.replace(/_/g, ' ')}</Badge> : null}
                </span>
                <span className="adm-note">{s.signupSource || 'seed'}{s.trialEndsAt ? ` · trial ends ${s.trialEndsAt.slice(0, 10)}` : ''}</span>
              </div>
            )) : <Empty>No signups yet.</Empty>}
          </Card>
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
