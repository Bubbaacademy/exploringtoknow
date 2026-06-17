/**
 * Phase 14 — second-tenant isolation verification.
 *
 * Proves TRUE server-side tenant isolation by exercising Payload access control
 * (overrideAccess:false + a `user` context) against a temporary second tenant.
 * It creates Tenant B / Workspace B / User B / Membership(editor) / an Article B,
 * runs the isolation assertions, then DELETES everything it created (idempotent
 * cleanup also runs first, so a previous crashed run leaves no residue).
 *
 * Run inside the migrate image (has payload + tsx + DB):
 *   pnpm --filter @etk/web exec tsx scripts/verify-tenant-isolation.ts
 */
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { adminPanelAccess } from '../src/lib/access';

const T_SLUG = 'iso-test-b';
const W_SLUG = 'iso-test-b-ws';
const U_EMAIL = 'iso-test-b@example.com';
const A_SLUG = 'iso-test-b-article';

const refId = (v: any): any => (v == null ? null : typeof v === 'object' ? v.id : v);

async function cleanup(payload: any) {
  const o = { overrideAccess: true } as const;
  const art = await payload.find({ collection: 'articles', where: { slug: { equals: A_SLUG } }, limit: 10, ...o });
  for (const d of art.docs) await payload.delete({ collection: 'articles', id: d.id, ...o });
  const usr = await payload.find({ collection: 'users', where: { email: { equals: U_EMAIL } }, limit: 10, ...o });
  for (const u of usr.docs) {
    const ms = await payload.find({ collection: 'memberships', where: { user: { equals: u.id } }, limit: 50, ...o });
    for (const m of ms.docs) await payload.delete({ collection: 'memberships', id: m.id, ...o });
    await payload.delete({ collection: 'users', id: u.id, ...o });
  }
  const ws = await payload.find({ collection: 'workspaces', where: { slug: { equals: W_SLUG } }, limit: 10, ...o });
  for (const d of ws.docs) await payload.delete({ collection: 'workspaces', id: d.id, ...o });
  const tn = await payload.find({ collection: 'tenants', where: { slug: { equals: T_SLUG } }, limit: 10, ...o });
  for (const d of tn.docs) await payload.delete({ collection: 'tenants', id: d.id, ...o });
}

async function main() {
  const payload = await getPayload({ config });
  const out: string[] = [];
  let fails = 0;
  const check = (name: string, ok: boolean) => { out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) fails++; };
  const o = { overrideAccess: true } as const;

  await cleanup(payload); // clear any prior residue

  try {
    const etkT = (await payload.find({ collection: 'tenants', where: { slug: { equals: 'exploringtoknow' } }, limit: 1, ...o })).docs[0];
    const etkArticle = (await payload.find({ collection: 'articles', where: { tenant: { equals: etkT.id } }, limit: 1, ...o })).docs[0];
    const actorA = (await payload.find({ collection: 'users', limit: 1, sort: 'id', ...o })).docs[0]; // the platform super admin

    // --- temporary Tenant B ---
    const tB = await payload.create({ collection: 'tenants', data: { name: '__ISO_TEST_B', slug: T_SLUG, status: 'active', plan: 'free' }, ...o });
    const wB = await payload.create({ collection: 'workspaces', data: { tenant: tB.id, name: '__ISO_TEST_B_WS', slug: W_SLUG, mode: 'hosted', status: 'active' }, ...o });
    const uB = await payload.create({ collection: 'users', data: { email: U_EMAIL, password: 'IsoTest!23456', name: 'Iso B', role: 'operator' }, ...o });
    await payload.create({ collection: 'memberships', data: { user: uB.id, tenant: tB.id, workspace: wB.id, role: 'editor' }, ...o });
    const artB = await payload.create({ collection: 'articles', data: { title: '__ISO_TEST_B Article', slug: A_SLUG, type: 'how_to', status: 'generating', editorialStatus: 'draft', tenant: tB.id, workspace: wB.id }, ...o });

    const asA = { overrideAccess: false as const, user: actorA };
    const asB = { overrideAccess: false as const, user: uB };
    // Payload THROWS Forbidden (403) when an access rule returns `false` (a hard
    // deny), and returns a filtered (possibly empty) result when it returns a Where.
    // safeFind normalises both so a deny reads as { forbidden:true }.
    const safeFind = async (opts: any): Promise<{ totalDocs: number; docs: any[]; forbidden: boolean }> => {
      try { const r = await payload.find(opts); return { totalDocs: r.totalDocs, docs: r.docs, forbidden: false }; }
      catch (e: any) {
        if (e?.status === 403 || /forbidden/i.test(String(e?.message))) return { totalDocs: 0, docs: [], forbidden: true };
        throw e;
      }
    };

    // 1. super admin (A) can read Tenant B article
    check('super admin can read Tenant B article', (await safeFind({ collection: 'articles', where: { id: { equals: artB.id } }, ...asA })).totalDocs === 1);
    // 2. Tenant B member can read own article
    check('Tenant B member can read own article', (await safeFind({ collection: 'articles', where: { id: { equals: artB.id } }, ...asB })).totalDocs === 1);
    // 3. Tenant B member CANNOT read a Tenant A article (scoped Where → 0 rows)
    check('Tenant B member CANNOT read Tenant A article', (await safeFind({ collection: 'articles', where: { id: { equals: etkArticle.id } }, ...asB })).totalDocs === 0);
    // 4. Tenant B listing leaks no Tenant A rows
    const bList = await safeFind({ collection: 'articles', limit: 200, ...asB });
    check('Tenant B article listing contains ONLY Tenant B', bList.docs.every((d: any) => String(refId(d.tenant)) === String(tB.id)) && bList.totalDocs >= 1);
    // 5. super admin sees BOTH tenants' articles
    const aList = await safeFind({ collection: 'articles', limit: 500, ...asA });
    const aTenants = new Set(aList.docs.map((d: any) => String(refId(d.tenant))));
    check('super admin sees Tenant A AND Tenant B articles', aTenants.has(String(etkT.id)) && aTenants.has(String(tB.id)));
    // 6. cross-collection: Tenant B sees no Tenant A rows (scoped → 0 A rows, never a leak)
    for (const coll of ['products', 'categories', 'media', 'authors', 'newsletter-subscribers', 'contact-messages', 'generation-runs', 'article-views', 'product-requests', 'brands', 'content-briefs', 'product-intelligence', 'social-posts']) {
      const r = await safeFind({ collection: coll as any, limit: 500, ...asB });
      const leak = r.docs.filter((d: any) => refId(d.tenant) != null && String(refId(d.tenant)) !== String(tB.id));
      check(`Tenant B sees no Tenant A rows in ${coll}`, !r.forbidden && leak.length === 0);
    }
    // 7. anonymous REST article read = published only (drafts hidden, no cross-tenant drafts)
    const anon = await safeFind({ collection: 'articles', limit: 500, overrideAccess: false });
    check('anonymous article read = published only (no drafts)', !anon.forbidden && anon.docs.every((d: any) => d.editorialStatus === 'published'));
    // 8. anonymous CANNOT read private collections (hard deny → Forbidden)
    check('anonymous CANNOT read products', (await safeFind({ collection: 'products', limit: 10, overrideAccess: false })).forbidden === true);
    check('anonymous CANNOT read product-requests', (await safeFind({ collection: 'product-requests', limit: 10, overrideAccess: false })).forbidden === true);
    // 9. Tenant B member cannot read Tenant A tenant/workspace/memberships
    check('Tenant B cannot read Tenant A tenant row', (await safeFind({ collection: 'tenants', where: { id: { equals: etkT.id } }, ...asB })).totalDocs === 0);
    const bMs = await safeFind({ collection: 'memberships', limit: 200, ...asB });
    check('Tenant B sees only its own memberships', !bMs.forbidden && bMs.docs.every((m: any) => String(refId(m.user)) === String(uB.id)));
    // 10. admin-panel gate
    check('admin gate: super admin allowed', (await adminPanelAccess({ req: { user: actorA, payload } as any })) === true);
    check('admin gate: workspace user BLOCKED', (await adminPanelAccess({ req: { user: uB, payload } as any })) === false);
    check('admin gate: anonymous BLOCKED', (await adminPanelAccess({ req: { user: null, payload } as any })) === false);
  } finally {
    await cleanup(payload);
    out.push('--- temporary tenant B + all test rows DELETED (cleanup ran) ---');
  }

  console.log(out.join('\n'));
  if (fails) { console.error(`\n${fails} ISOLATION CHECK(S) FAILED`); process.exit(1); }
  console.log('\nALL TENANT-ISOLATION CHECKS PASSED');
  process.exit(0);
}

main().catch((e) => { console.error('isolation verify crashed:', e); process.exit(1); });
