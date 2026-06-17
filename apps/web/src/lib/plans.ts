/**
 * Central plan + limit definitions (Phase 19). Pure module — safe to import in
 * client and server. This is the SINGLE source of truth for plan limits; both the
 * UI (plan cards) and server-side enforcement read from here. `null` = unlimited.
 */
export type PlanId = 'trial' | 'starter' | 'pro' | 'agency' | 'enterprise' | 'comped';

export type PlanLimits = {
  /** Total members allowed in a workspace (owner + invited). null = unlimited. */
  teamMembers: number | null;
  /** Product/article requests that may be created per calendar month. */
  requestsPerMonth: number | null;
  /** Total media uploads retained in the workspace. */
  mediaUploads: number | null;
  /** Custom publication domain available. */
  customDomain: boolean;
};

export type Plan = {
  id: PlanId;
  label: string;
  blurb: string;
  priceText: string;
  /** Env key holding the Stripe price id (server-side only). */
  priceEnvKey?: string;
  /** Shown on plan cards / upgrade surfaces (false = internal/hidden). */
  selectable: boolean;
  limits: PlanLimits;
};

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: 'trial', label: 'Free trial', blurb: '14 days to explore — no credit card.', priceText: 'Free for 14 days', selectable: false,
    limits: { teamMembers: 3, requestsPerMonth: 3, mediaUploads: 20, customDomain: false },
  },
  starter: {
    id: 'starter', label: 'Starter', blurb: 'For a solo publisher getting going.', priceText: '$29/mo', priceEnvKey: 'STRIPE_PRICE_STARTER', selectable: true,
    limits: { teamMembers: 3, requestsPerMonth: 10, mediaUploads: 100, customDomain: false },
  },
  pro: {
    id: 'pro', label: 'Pro', blurb: 'For a growing content-commerce team.', priceText: '$99/mo', priceEnvKey: 'STRIPE_PRICE_PRO', selectable: true,
    limits: { teamMembers: 10, requestsPerMonth: 50, mediaUploads: 500, customDomain: false },
  },
  agency: {
    id: 'agency', label: 'Agency', blurb: 'For agencies running multiple brands.', priceText: '$299/mo', priceEnvKey: 'STRIPE_PRICE_AGENCY', selectable: true,
    limits: { teamMembers: 25, requestsPerMonth: 200, mediaUploads: 2000, customDomain: true },
  },
  enterprise: {
    id: 'enterprise', label: 'Enterprise', blurb: 'Custom limits, custom domain, white-label.', priceText: 'Contact us', selectable: true,
    limits: { teamMembers: null, requestsPerMonth: null, mediaUploads: null, customDomain: true },
  },
  comped: {
    id: 'comped', label: 'Internal / comped', blurb: 'Unlimited internal workspace.', priceText: '—', selectable: false,
    limits: { teamMembers: null, requestsPerMonth: null, mediaUploads: null, customDomain: true },
  },
};

/** The plans shown on upgrade/comparison surfaces, in order. */
export const SELECTABLE_PLANS: Plan[] = ['starter', 'pro', 'agency', 'enterprise'].map((id) => PLANS[id as PlanId]);

/** Resolve a plan id to its definition; unknown plans fall back to `comped` (unlimited). */
export function planFor(planId: string | null | undefined): Plan {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.comped;
}

export const SUBSCRIPTION_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'comped', 'manual'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Pretty limit text ("Unlimited" for null). */
export const limitText = (n: number | null): string => (n == null ? 'Unlimited' : String(n));
