/**
 * Phase 2U — post-publish public verification. READ-ONLY. Plain ESM, fetch only.
 *
 *   node verify-public.mjs [slug ...]
 *
 * Hits public surfaces over HTTPS and asserts the magazine's standing invariants.
 * Never writes, never authenticates. Exit code 1 if any check fails, so it can
 * gate a batch.
 */

const SITE = process.env.ETK_SITE_URL || 'https://exploringtoknow.com';
const BUBBA = 'https://bubbaaffiliate.com';

const SECTIONS = ['home-living', 'beauty-style', 'tech', 'family-pets', 'food-kitchen', 'buying-guides', 'product-reviews', 'explore-picks'];
const FORBIDDEN_CTA = [
  'Request a Review', 'Request Access', 'Start Free Trial', 'free trial',
  'Create workspace', 'Create a workspace', 'My Workspace', 'BubbaAffiliate',
  'Submit Your Offer', 'Become a Creator', 'content-commerce',
];
const PLACEHOLDERS = [/\[TEST\]/i, /\bzzz/i, /\blorem ipsum\b/i, /\bTODO\b/, /\{PRODUCT\}/i, /\bVERIFY\b/];

const slugs = process.argv.slice(2);
let failures = 0;
const ok = (label, cond, detail = '') => {
  if (!cond) failures++;
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
};

const get = async (url, redirect = 'follow') => {
  try {
    const r = await fetch(url, { redirect });
    return { status: r.status, body: r.status < 400 ? await r.text() : '' };
  } catch (e) {
    return { status: 0, body: '', error: String(e) };
  }
};
const count = (hay, needle) => hay.split(needle).length - 1;

(async () => {
  console.log(`\n=== articles (${slugs.length}) ===`);
  for (const s of slugs) {
    const r = await get(`${SITE}/${s}`);
    ok(`/${s} → 200`, r.status === 200, `got ${r.status}`);
    if (r.status === 200) {
      ok(`/${s} has body content`, count(r.body, '<h2') >= 2, `${count(r.body, '<h2')} h2`);
      ok(`/${s} no placeholders`, !PLACEHOLDERS.some((p) => p.test(r.body)));
    }
  }

  console.log('\n=== homepage ===');
  const home = await get(`${SITE}/`);
  ok('homepage → 200', home.status === 200);
  ok('homepage no placeholders', !PLACEHOLDERS.some((p) => p.test(home.body)));
  ok('no public header Log in', count(home.body, '>Log in<') === 0);
  ok('Staff Login present (footer)', count(home.body, 'footer-staff') > 0);

  console.log('\n=== sections ===');
  for (const s of SECTIONS) {
    const r = await get(`${SITE}/${s}`);
    ok(`/${s} → 200`, r.status === 200, `got ${r.status}`);
  }

  console.log('\n=== sitemap ===');
  const sm = await get(`${SITE}/sitemap.xml`);
  ok('sitemap → 200', sm.status === 200);
  for (const s of slugs) ok(`sitemap contains ${s}`, sm.body.includes(s));
  ok('sitemap has no zzz-test slug', !sm.body.includes('zzz-test'));

  console.log('\n=== search ===');
  for (const s of slugs) {
    const term = s.split('-').slice(0, 2).join(' ');
    const r = await get(`${SITE}/search?q=${encodeURIComponent(term)}`);
    ok(`search "${term}" finds ${s}`, r.body.includes(s));
  }

  console.log('\n=== author ===');
  const au = await get(`${SITE}/author/exploringtoknow-editorial-team`);
  ok('author page → 200', au.status === 200);
  const m = au.body.replace(/<[^>]+>/g, ' ').match(/(\d+)\s+published guides?/);
  console.log(`  info  author masthead: ${m ? m[0] : '(no meta line)'}`);

  console.log('\n=== guardrails ===');
  for (const p of ['/', '/buying-guides', '/product-reviews', ...slugs.map((s) => `/${s}`)]) {
    const r = await get(`${SITE}${p}`);
    const hits = FORBIDDEN_CTA.filter((t) => r.body.toLowerCase().includes(t.toLowerCase()));
    ok(`${p} free of forbidden CTAs`, hits.length === 0, hits.join(', '));
    ok(`${p} no header Log in`, count(r.body, '>Log in<') === 0);
  }

  console.log('\n=== gated routes (signed out) ===');
  for (const p of ['/dashboard/content', '/dashboard', '/app']) {
    const r = await get(`${SITE}${p}`, 'manual');
    ok(`${p} → 307`, r.status === 307, `got ${r.status}`);
  }

  console.log('\n=== bubbaaffiliate unchanged ===');
  for (const p of ['/', '/sellers', '/creators']) {
    const r = await get(`${BUBBA}${p}`);
    ok(`bubbaaffiliate${p} → 200`, r.status === 200, `got ${r.status}`);
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('fatal:', e?.message || e); process.exit(1); });
