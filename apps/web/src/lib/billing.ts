import { getPayload } from 'payload';
import config from '@payload-config';
import { wsCount, type WorkspaceScope, type WorkspaceSession } from './workspace';
import { planFor, SELECTABLE_PLANS, type Plan, type PlanLimits } from './plans';
import type { Doc } from './tenant';

/**
 * Billing usage + enforcement (Phase 19). Usage is REAL (counted from scoped
 * collections, never fabricated). Limits come from lib/plans.ts. Enforcement is
 * server-side; the workspace/tenant is derived from the session, never the client.
 * Comped/unknown plans (e.g. the internal ExploringToKnow tenant) are unlimited.
 */
export type Usage = {
  requestsThisMonth: number;
  mediaCount: number;
  memberCount: number;
  pendingInvites: number;
  published: number;
  drafts: number;
  ready: number;
};

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function getWorkspaceUsage(scope: WorkspaceScope): Promise<Usage> {
  const monthStart = startOfMonthISO();
  const [requestsThisMonth, mediaCount, memberCount, pendingInvites, published, drafts, ready] = await Promise.all([
    wsCount(scope, 'product-requests', { createdAt: { greater_than_equal: monthStart } }),
    wsCount(scope, 'media'),
    wsCount(scope, 'memberships'),
    wsCount(scope, 'workspace-invitations', { status: { equals: 'pending' } }),
    wsCount(scope, 'articles', { editorialStatus: { equals: 'published' } }),
    wsCount(scope, 'articles', { editorialStatus: { equals: 'draft' } }),
    wsCount(scope, 'articles', { editorialStatus: { equals: 'ready_for_review' } }),
  ]);
  return { requestsThisMonth, mediaCount, memberCount, pendingInvites, published, drafts, ready };
}

export type TenantPlan = {
  plan: Plan;
  planId: string;
  status: string;
  limits: PlanLimits;
  trialEndsAt: Date | null;
  trialExpired: boolean;
  /** Subscription is inactive (canceled/unpaid) → new create actions are blocked. */
  restricted: boolean;
  /** Last payment failed (grace period) → warn, but not blocked. */
  pastDue: boolean;
  comped: boolean;
};

export function getTenantPlan(tenant: Doc | null): TenantPlan {
  const planId = String(tenant?.plan ?? 'free');
  const plan = planFor(planId);
  const status = String(tenant?.subscriptionStatus ?? (String(tenant?.status) === 'trial' ? 'trialing' : 'active'));
  const trialEndsAt = tenant?.trialEndsAt ? new Date(String(tenant.trialEndsAt)) : null;
  const comped = plan.id === 'comped' || status === 'comped' || status === 'manual';
  const trialExpired = !comped && status === 'trialing' && !!trialEndsAt && trialEndsAt.getTime() < Date.now();
  const restricted = !comped && (status === 'canceled' || status === 'unpaid');
  const pastDue = !comped && status === 'past_due';
  return { plan, planId: plan.id, status, limits: plan.limits, trialEndsAt, trialExpired, restricted, pastDue, comped };
}

/**
 * Server-side reverse map: resolve a Stripe price id back to its plan via each
 * selectable plan's price env key. Returns null if no plan matches (or no env).
 * Lets the webhook reflect portal-driven plan changes into the tenant's plan.
 */
export function planByPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  for (const p of SELECTABLE_PLANS) {
    if (p.priceEnvKey && process.env[p.priceEnvKey] && process.env[p.priceEnvKey] === priceId) return p;
  }
  return null;
}

export type ActionKey = 'create_request' | 'upload_media' | 'invite';
export type Capability = { ok: boolean; reason?: string; used?: number; limit?: number | null };

export async function workspaceCapability(ws: WorkspaceSession, action: ActionKey): Promise<Capability> {
  const tp = getTenantPlan(ws.tenant);
  if (tp.comped) return { ok: true };
  if (tp.trialExpired) return { ok: false, reason: 'Your free trial has ended. Upgrade to continue.' };
  if (tp.restricted) return { ok: false, reason: 'Your subscription is inactive. Update billing to continue.' };
  const usage = await getWorkspaceUsage(ws.scope);
  const limit = action === 'create_request' ? tp.limits.requestsPerMonth
    : action === 'upload_media' ? tp.limits.mediaUploads
    : tp.limits.teamMembers;
  const used = action === 'create_request' ? usage.requestsThisMonth
    : action === 'upload_media' ? usage.mediaCount
    : usage.memberCount + usage.pendingInvites;
  const noun = action === 'create_request' ? 'requests this month' : action === 'upload_media' ? 'media uploads' : 'team members';
  if (limit == null || used < limit) return { ok: true, used, limit };
  return { ok: false, used, limit, reason: `You’ve reached your ${tp.plan.label} limit (${limit} ${noun}). Upgrade to continue.` };
}

// ---- provider config (present/missing only; never expose values) ----
export const billingEnabled = (): boolean => process.env.BILLING_ENABLED === 'true';
export const stripeConfigured = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY);
export const billingProvider = (): string => process.env.BILLING_PROVIDER || 'local';
/** True only when billing is enabled AND a Stripe secret is present. */
export const billingLive = (): boolean => billingEnabled() && stripeConfigured();

/** Platform-wide billing aggregate for /platform (no secrets, no tenant data). */
export async function getBillingOverview() {
  const payload = await getPayload({ config });
  const count = async (where: Doc = {}) => (await payload.count({ collection: 'tenants', where })).totalDocs;
  const [total, trialing, active, pastDue, canceled, comped, legacyTrial] = await Promise.all([
    count(),
    count({ subscriptionStatus: { equals: 'trialing' } }),
    count({ subscriptionStatus: { equals: 'active' } }),
    count({ subscriptionStatus: { equals: 'past_due' } }),
    count({ subscriptionStatus: { equals: 'canceled' } }),
    count({ subscriptionStatus: { equals: 'comped' } }),
    count({ and: [{ status: { equals: 'trial' } }, { subscriptionStatus: { exists: false } }] }),
  ]);
  return {
    total, trialing: trialing + legacyTrial, active, pastDue, canceled, comped,
    providerActive: billingLive(), stripePresent: stripeConfigured(), provider: billingProvider(),
  };
}
