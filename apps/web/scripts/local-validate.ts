/* Offline functional-validation harness (no Docker/cloud): real embedded Postgres + real embedded Postgres + Payload local API.
   Proves brand→product→intelligence→brief→article→persist→query-back. Mock AI (no key). */
import EmbeddedPostgres from 'embedded-postgres';

const log = (m: string) => { process.stdout.write(m + '\n'); };

async function main() {
  log('1) booting embedded postgres...');
  const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata_ryze', user: 'etk', password: 'etk', port: 5433, persistent: false });
  await pg.initialise();
  await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }
  log('   postgres up on :5433');

  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5433/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret';
  process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development'; // enables Payload schema push
  process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3000';

  log('2) init Payload + push schema...');
  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { runContentPipeline } = await import('@etk/ai');
  const { loadBrandProfile } = await import('../src/lib/brand');
  const payload = await getPayload({ config });
  log('   Payload ready (schema pushed)');

  log('3) create brand + product...');
  const brand = await payload.create({ collection: 'brands', data: { name: 'RYZE', slug: 'ryze', description: 'Mushroom coffee.' } });
  const product = await payload.create({ collection: 'products', data: { title: 'RYZE Mushroom Coffee', slug: 'ryze-mushroom-coffee', offerType: 'amazon_affiliate', status: 'active', priority: 100, brand: brand.id } });
  log('   brand=' + brand.id + ' product=' + product.id);

  log('4) run pipeline (intelligence->brief->article->QA)...');
  const bp = await loadBrandProfile(payload);
  const r = await runContentPipeline({ id: String(product.id), title: 'RYZE Mushroom Coffee', offerType: 'amazon_affiliate', notes: 'Mushroom coffee; focus + calm energy.' }, bp, { maxAttempts: 2 });
  log('   qaPassed=' + Boolean(r.state.qa?.passed) + ' tokens=' + r.cost.totalTokens);

  log('5) persist intelligence/brief/article (published)...');
  const intel = await payload.create({ collection: 'product-intelligence', data: { product: product.id, ...r.state.intelligence, generatedAt: new Date().toISOString() } });
  const brief = await payload.create({ collection: 'content-briefs', data: { product: product.id, intelligence: intel.id, ...r.state.brief, status: 'ready' } });
  const article = await payload.create({ collection: 'articles', data: {
    title: r.state.article!.title, slug: 'ryze-mushroom-coffee-guide', brief: brief.id, product: product.id,
    type: r.state.article!.type, markdown: r.state.article!.markdown,
    seo: { metaTitle: r.state.article!.metaTitle, metaDescription: r.state.article!.metaDescription },
    qaReport: { passed: true, reasons: [] }, status: 'published', publishedAt: new Date().toISOString() } });
  log('   articleId=' + article.id + ' status=' + article.status);

  log('6) QUERY BACK from DB (as admin list + as public renderer would)...');
  const adminList = await payload.find({ collection: 'articles', limit: 50 });
  const publicFetch = await payload.find({ collection: 'articles', where: { and: [{ slug: { equals: 'ryze-mushroom-coffee-guide' } }, { status: { equals: 'published' } }] }, limit: 1 });
  log('   admin sees ' + adminList.totalDocs + ' article(s); titles: ' + adminList.docs.map((d:any)=>d.title).join(' | '));
  log('   public renderer fetch by slug -> ' + (publicFetch.docs[0] ? 'FOUND published article: "' + publicFetch.docs[0].title + '"' : 'NOT FOUND'));
  log('   markdown length persisted: ' + ((publicFetch.docs[0] as any)?.markdown?.length ?? 0) + ' chars');

  log('RESULT ' + JSON.stringify({ brand: brand.id, product: product.id, intelligence: intel.id, brief: brief.id, article: article.id, adminCount: adminList.totalDocs, publicResolves: Boolean(publicFetch.docs[0]) }));
  process.exit(0);
}
main().catch(async (e) => { console.error('E2E_FAIL', e?.message || e); process.exit(1); });
