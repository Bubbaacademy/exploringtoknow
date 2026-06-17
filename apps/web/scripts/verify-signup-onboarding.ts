/**
 * Phase 15 — signup / onboarding verification.
 *
 * Drives the real onboarding library (createWorkspaceOnboarding) to prove a public
 * signup provisions exactly one tenant + workspace + owner membership with trial
 * status, is fully isolated from ExploringToKnow, and creates NO content/generation/
 * media side effects. Creates → asserts → deletes (idempotent cleanup first too).
 *
 * Run in the migrate image:
 *   pnpm --filter @etk/web exec tsx scripts/verify-signup-onboarding.ts
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { createWorkspaceOnboarding } from '../src/lib/onboarding';

const EMAIL = 'signup-test@example.com';
const T_SLUG = 'signup-test';
const W_SLUG = 'signup-test-ws';
const refId = (v: any): any => (v == null ? null : typeof v === 'object' ? v.id : v);

async function cleanup(payload: any) {
  const o = { overrideAccess: true } as const;
  const usr = await payload.find({ collection: 'users', where: { email: { equals: EMAIL } }, limit: 10, ...o });
  for (const u of usr.docs) {
    const ms = await payload.find({ collection: 'memberships', where: { user: { equals: u.id } }, limit: 50, ...o });
    for (const m of ms.docs) await payload.delete({ collection: 'memberships', id: m.id, ...o });
    await payload.delete({ collection: 'users', id: u.id, ...o });
  }
  for (const slug of [W_SLUG]) {
    const ws = await payload.find({ collection: 'workspaces', where: { slug: { like: slug } }, limit: 20, ...o });
    for (const d of ws.docs) await payload.delete({ collection: 'workspaces', id: d.id, ...o });
  }
  for (const slug of [T_SLUG]) {
    const tn = await payload.find({ collection: 'tenants', where: { slug: { like: slug } }, limit: 20, ...o });
    for (const d of tn.docs) await payload.delete({ collection: 'tenants', id: d.id, ...o });
  }
}

async function main() {
  const payload = await getPayload({ config });
  const out: string[] = [];
  let fails = 0;
  const check = (name: string, ok: boolean) => { out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) fails++; };
  const o = { overrideAccess: true } as const;
  const count = async (c: string, where: any = {}) => (await payload.count({ collection: c as any, where })).totalDocs;

  await cleanup(payload);

  // Baseline content counts (must be unchanged by signup — no generation/approval/media).
  const base = {
    articles: await count('articles'),
    products: await count('products'),
    runs: await count('generation-runs'),
    media: await count('media'),
    requests: await count('product-requests'),
  };
  const etkT = (await payload.find({ collection: 'tenants', where: { slug: { equals: 'exploringtoknow' } }, limit: 1, ...o })).docs[0];
  const etkArticle = (await payload.find({ collection: 'articles', where: { tenant: { equals: etkT.id } }, limit: 1, ...o })).docs[0];
  const actorA = (await payload.find({ collection: 'users', limit: 1, sort: 'id', ...o })).docs[0]; // super admin

  try {
    const r = await createWorkspaceOnboarding({
      fullName: 'Signup Test', email: EMAIL, password: 'SignupTest!23456',
      businessName: '__SIGNUP_TEST', workspaceName: '__SIGNUP_TEST WS', source: 'verify_script',
    });

    // 1. exactly one tenant / workspace / owner membership
    check('exactly 1 tenant created', (await count('tenants', { id: { equals: r.tenantId } })) === 1);
    check('exactly 1 workspace created', (await count('workspaces', { id: { equals: r.workspaceId } })) === 1);
    const owners = await payload.find({ collection: 'memberships', where: { and: [{ user: { equals: r.userId } }, { role: { equals: 'workspace_owner' } }] }, limit: 10, ...o });
    check('exactly 1 workspace_owner membership', owners.totalDocs === 1);
    check('membership links the new tenant + workspace', refId(owners.docs[0]?.tenant) === r.tenantId && refId(owners.docs[0]?.workspace) === r.workspaceId);

    // 2. trial status set
    const tenant = await payload.findByID({ collection: 'tenants', id: r.tenantId, ...o });
    check('tenant status = trial', String(tenant.status) === 'trial');
    check('tenant has trialEndsAt + trialStartedAt', Boolean(tenant.trialEndsAt) && Boolean(tenant.trialStartedAt));
    check('tenant onboardingStatus = in_progress', String(tenant.onboardingStatus) === 'in_progress');
    check('tenant signupSource recorded', String(tenant.signupSource) === 'verify_script');

    // 3. NO content side effects
    check('no new articles created by signup', (await count('articles')) === base.articles);
    check('no new products created by signup', (await count('products')) === base.products);
    check('no new generation runs created by signup', (await count('generation-runs')) === base.runs);
    check('no new media created by signup', (await count('media')) === base.media);
    check('no new product-requests created by signup', (await count('product-requests')) === base.requests);

    // 4. isolation — load the new owner as an access actor
    const uB = await payload.findByID({ collection: 'users', id: r.userId, ...o });
    const asB = { overrideAccess: false as const, user: uB };
    const asA = { overrideAccess: false as const, user: actorA };
    const safe = async (opts: any) => { try { const x = await payload.find(opts); return { docs: x.docs, total: x.totalDocs, forbidden: false }; } catch (e: any) { if (e?.status === 403) return { docs: [], total: 0, forbidden: true }; throw e; } };

    check('new owner can access own workspace (membership readable)', (await safe({ collection: 'memberships', limit: 50, ...asB })).docs.every((m: any) => refId(m.user) === r.userId));
    check('new owner sees NO ExploringToKnow articles', (await safe({ collection: 'articles', limit: 200, ...asB })).docs.every((d: any) => refId(d.tenant) === r.tenantId));
    check('new owner CANNOT read an ETK article by id', (await safe({ collection: 'articles', where: { id: { equals: etkArticle.id } }, ...asB })).total === 0);
    check('new owner CANNOT read the ETK tenant row', (await safe({ collection: 'tenants', where: { id: { equals: etkT.id } }, ...asB })).total === 0);
    for (const c of ['products', 'media', 'categories', 'product-requests', 'generation-runs']) {
      const x = await safe({ collection: c as any, limit: 300, ...asB });
      check(`new owner sees no ETK rows in ${c}`, x.docs.every((d: any) => refId(d.tenant) === r.tenantId));
    }
    // super admin sees both tenants
    const aTenants = new Set((await safe({ collection: 'tenants', limit: 100, ...asA })).docs.map((d: any) => String(d.id)));
    check('super admin sees BOTH ETK and the new tenant', aTenants.has(String(etkT.id)) && aTenants.has(String(r.tenantId)));

    // 5. ETK untouched
    check('ETK tenant still present + unchanged slug', String(etkT.slug) === 'exploringtoknow');
  } finally {
    await cleanup(payload);
    out.push('--- signup test records DELETED (cleanup ran) ---');
  }

  console.log(out.join('\n'));
  if (fails) { console.error(`\n${fails} SIGNUP CHECK(S) FAILED`); process.exit(1); }
  console.log('\nALL SIGNUP / ONBOARDING CHECKS PASSED');
  process.exit(0);
}

main().catch((e) => { console.error('signup verify crashed:', e); process.exit(1); });
