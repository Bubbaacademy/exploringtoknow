/* Maximum local pre-flight: real embedded Postgres, full FLANCCI workflow,
   then reproduce the public renderer's fetch + markdown render. Mock AI (no key). */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, readFileSync } from 'node:fs';

const ok = (b: boolean, m: string) => console.log(`${b ? 'PASS' : 'FAIL'}  ${m}`);

async function main() {
  const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata_pf', user: 'etk', password: 'etk', port: 5435, persistent: false });
  await pg.initialise(); await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch {}
  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5435/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret'; process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development'; process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://exploringtoknow.com';

  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { loadBrandProfile } = await import('../src/lib/brand');
  const { validateOneArticle } = await import('./lib/validation');
  const { FLANCCI_CASE } = await import('./cases/flancci');
  const { marked } = await import('marked');

  const payload = await getPayload({ config });
  const brandProfile = await loadBrandProfile(payload);

  const r = await validateOneArticle(payload, {
    brand: FLANCCI_CASE.brand, product: FLANCCI_CASE.product, brandProfile, outDir: '/tmp',
  });

  console.log('\n===== BLUEPRINT STEP VERIFICATION =====');
  ok(!!r.brandId, 'Brand created');
  ok(!!r.productId, 'Product created');
  const intel = await payload.find({ collection: 'product-intelligence', limit: 1 });
  ok(intel.totalDocs === 1, 'Product Intelligence persisted');
  const briefs = await payload.find({ collection: 'content-briefs', limit: 1 });
  ok(briefs.totalDocs === 1, 'Content Brief persisted');
  ok(!!r.articleId, 'Article persisted');
  ok(r.articleStatus === 'published', 'Article published (status=published)');

  // reproduce the PUBLIC RENDERER query exactly
  const slug = r.publicUrl.split('/').pop()!;
  const pub = await payload.find({ collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] }, limit: 1 });
  ok(pub.totalDocs === 1, 'Public renderer query resolves the article by slug+published');
  const html = await marked.parse((pub.docs[0] as any).markdown || '');
  ok(typeof html === 'string' && html.length > 0, 'Markdown renders to HTML (public page body)');

  // QA + generation-runs ledger
  const runs = await payload.find({ collection: 'generation-runs', limit: 1 });
  ok(runs.totalDocs === 1 && (runs.docs[0] as any).totalTokens >= 0, 'generation-runs ledger persisted (tokens/cost)');

  // reports
  for (const f of ['REAL_AI_VALIDATION_REPORT.md', 'TOKEN_COST_REPORT.md', 'QUALITY_EVALUATION_REPORT.md']) {
    ok(existsSync('/tmp/' + f), `Report generated: ${f}`);
  }
  const q = readFileSync('/tmp/QUALITY_EVALUATION_REPORT.md', 'utf8');
  for (const k of ['Overall quality score', 'SEO score', 'Readability score', 'Affiliate usefulness score', 'Reading grade']) {
    ok(q.includes(k), `Quality report includes: ${k}`);
  }
  console.log('\nPUBLIC_URL_PATTERN https://exploringtoknow.com/<article-slug>');
  console.log('SAMPLE_SLUG', slug);
  process.exit(0);
}
main().catch((e) => { console.error('PREFLIGHT_FAIL', e?.message || e); process.exit(1); });
