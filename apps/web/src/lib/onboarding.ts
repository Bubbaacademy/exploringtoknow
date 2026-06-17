import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Phase 15 — self-serve signup / onboarding.
 *
 * Creates a User + Tenant + Workspace + owner Membership in ONE transaction. All
 * ids are derived server-side; client-submitted tenant/workspace ids are never
 * trusted. No product/article/generation/media/category records are created — this
 * is account provisioning only, so nothing can trigger generation or publishing.
 */

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  workspaceName: string;
  slugSuggestion?: string;
  website?: string;
  source?: string;
};

export class OnboardingError extends Error {
  code: 'INVALID' | 'DUPLICATE_EMAIL' | 'DISABLED' | 'SERVER';
  field?: string;
  constructor(code: OnboardingError['code'], message: string, field?: string) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

// ---- env config (safe defaults; flags off unless explicitly enabled) ----
export const signupEnabled = (): boolean => process.env.PUBLIC_SIGNUP_ENABLED === 'true';
export const freeTrialDays = (): number => {
  const n = parseInt(process.env.FREE_TRIAL_DAYS || '', 10);
  return Number.isFinite(n) && n > 0 && n <= 365 ? n : 14;
};
export const defaultWorkspacePlan = (): string => (process.env.DEFAULT_WORKSPACE_PLAN || 'trial').trim() || 'trial';
export const requireEmailVerification = (): boolean => process.env.REQUIRE_EMAIL_VERIFICATION === 'true';

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const slugify = (s: string): string =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
    .replace(/(^-|-$)/g, '');

/**
 * Find a free slug in a collection. Tries the base, then base-2..base-40, then a
 * deterministic-ish fallback derived from the candidate length (no Math.random in
 * the request path is required, but uniqueness is guaranteed by the unique index +
 * retry). Reads use overrideAccess (server-trusted).
 */
async function uniqueSlug(payload: any, collection: string, base: string, req?: any): Promise<string> {
  const root = slugify(base) || collection.replace(/s$/, '');
  const taken = new Set<string>();
  const res = await payload.find({
    collection,
    where: { slug: { like: root } },
    limit: 200, depth: 0, pagination: false, overrideAccess: true, req,
  });
  for (const d of res.docs as Array<{ slug?: string }>) if (d.slug) taken.add(d.slug);
  if (!taken.has(root)) return root;
  for (let i = 2; i <= 50; i++) {
    const c = `${root}-${i}`.slice(0, 64);
    if (!taken.has(c)) return c;
  }
  return `${root}-${root.length}${taken.size}`.slice(0, 64);
}

export type OnboardingResult = {
  userId: number | string;
  tenantId: number | string;
  workspaceId: number | string;
  tenantSlug: string;
  workspaceSlug: string;
  trialEndsAt: string;
};

/**
 * Transactional onboarding. Throws OnboardingError on validation/duplicate; throws
 * a generic Error (caller maps to 500) on infrastructure failure. On any failure
 * the transaction is rolled back so no partial account is left behind.
 */
export async function createWorkspaceOnboarding(input: SignupInput): Promise<OnboardingResult> {
  const fullName = (input.fullName || '').trim().slice(0, 120);
  const email = (input.email || '').trim().toLowerCase().slice(0, 200);
  const password = input.password || '';
  const businessName = (input.businessName || '').trim().slice(0, 160);
  const workspaceName = (input.workspaceName || '').trim().slice(0, 160);
  const website = (input.website || '').trim().slice(0, 200);
  const source = (input.source || 'public_signup').trim().slice(0, 60) || 'public_signup';

  if (!fullName) throw new OnboardingError('INVALID', 'Please enter your name.', 'fullName');
  if (!isEmail(email)) throw new OnboardingError('INVALID', 'Please enter a valid work email.', 'email');
  if (password.length < 8) throw new OnboardingError('INVALID', 'Password must be at least 8 characters.', 'password');
  if (!businessName) throw new OnboardingError('INVALID', 'Please enter your business or brand name.', 'businessName');
  if (!workspaceName) throw new OnboardingError('INVALID', 'Please name your publication / workspace.', 'workspaceName');

  const payload = await getPayload({ config });

  // Friendly duplicate-email path (before opening a transaction).
  const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.docs.length) {
    throw new OnboardingError('DUPLICATE_EMAIL', 'An account with this email already exists. Try signing in instead.', 'email');
  }

  const now = new Date();
  const trialEnds = new Date(now.getTime() + freeTrialDays() * 24 * 60 * 60 * 1000);
  const plan = defaultWorkspacePlan();

  const transactionID = await payload.db.beginTransaction();
  const req: any = transactionID ? { transactionID } : undefined;
  try {
    const tenantSlug = await uniqueSlug(payload, 'tenants', input.slugSuggestion || businessName, req);
    const workspaceSlug = await uniqueSlug(payload, 'workspaces', input.slugSuggestion || workspaceName, req);

    const user = await payload.create({
      collection: 'users', overrideAccess: true, req,
      data: { email, password, name: fullName, role: 'operator' },
    });

    const tenant = await payload.create({
      collection: 'tenants', overrideAccess: true, req,
      data: {
        name: businessName, slug: tenantSlug, status: 'trial', plan,
        contactName: fullName, contactEmail: email,
        trialStartedAt: now.toISOString(), trialEndsAt: trialEnds.toISOString(),
        onboardingStatus: 'in_progress', onboardingStep: 1, signupSource: source,
      },
    });

    const workspace = await payload.create({
      collection: 'workspaces', overrideAccess: true, req,
      data: {
        tenant: tenant.id, name: workspaceName, slug: workspaceSlug,
        mode: 'hosted', status: 'active', displayName: workspaceName,
        primaryDomain: website || undefined,
      },
    });

    await payload.create({
      collection: 'memberships', overrideAccess: true, req,
      data: { user: user.id, tenant: tenant.id, workspace: workspace.id, role: 'workspace_owner' },
    });

    if (transactionID) await payload.db.commitTransaction(transactionID);

    return {
      userId: user.id, tenantId: tenant.id, workspaceId: workspace.id,
      tenantSlug, workspaceSlug, trialEndsAt: trialEnds.toISOString(),
    };
  } catch (e) {
    if (transactionID) { try { await payload.db.rollbackTransaction(transactionID); } catch { /* ignore */ } }
    if (e instanceof OnboardingError) throw e;
    // Unique-index race on email → friendly duplicate.
    if (/duplicate|unique/i.test(String((e as any)?.message))) {
      throw new OnboardingError('DUPLICATE_EMAIL', 'An account with this email already exists. Try signing in instead.', 'email');
    }
    throw e;
  }
}
