/* Focused Phase-2 tests: editorial visibility, manual intake approval idempotency,
 * no-generation-from-submitted, one-enqueue-from-approval, and affiliate CTA.
 * Isolated embedded Postgres; no Anthropic/OpenAI; no production connection. */
import EmbeddedPostgres from 'embedded-postgres';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

let fails = 0;
const ok = (b: boolean, m: string) => { console.log(`${b ? 'PASS' : 'FAIL'}  ${m}`); if (!b) fails += 1; };

async function main() {
  const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata_intake2', user: 'etk', password: 'etk', port: 5456, persistent: false });
  await pg.initialise(); await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }
  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5456/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret'; process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development'; process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3000';

  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { getPool } = await import('@etk/db');
  const { listPublishedArticles } = await import('../src/lib/public');
  const { AffiliateCTA } = await import('../src/components/site/AffiliateCTA');

  const payload = await getPayload({ config });
  const pool = getPool();
  const genJobs = async () => { try { const r = await pool.query("SELECT count(*)::int c FROM pgboss.job WHERE name='generate-content'"); return r.rows[0].c as number; } catch { return 0; } };

  console.log('===== PHASE 2 INTAKE / EDITORIAL TESTS =====');

  // --- editorial visibility ---
  const cat = await payload.create({ collection: 'categories', data: { name: 'Sleep', slug: 'sleep', active: true } });
  await payload.create({ collection: 'articles', data: { title: 'Published One', slug: 'pub-one', type: 'buying_guide', status: 'published', editorialStatus: 'published', editorialPublishedAt: new Date().toISOString(), category: cat.id, markdown: '# hi' } });
  await payload.create({ collection: 'articles', data: { title: 'Draft One', slug: 'draft-one', type: 'buying_guide', status: 'published', editorialStatus: 'ready_for_review', category: cat.id, markdown: '# hi' } });
  const pub = await listPublishedArticles({ limit: 50 });
  ok(pub.some((a: any) => a.slug === 'pub-one'), 'published article is publicly listed');
  ok(!pub.some((a: any) => a.slug === 'draft-one'), 'ready_for_review article is NOT publicly listed');

  // --- manual intake: submit creates NO generation job ---
  const before = await genJobs();
  const reqDoc = await payload.create({ collection: 'product-requests', data: {
    requesterName: 'Tester', requesterEmail: 't@example.com', productName: 'Test Widget',
    productUrl: 'https://example.com/p', affiliateUrl: 'https://aff.example.com/p?tag=etk-20',
    requestedCategory: cat.id, status: 'submitted',
  } });
  ok((await genJobs()) === before, 'submitted request enqueues NO generation job');

  // --- explicit approval enqueues exactly ONE job + links a product ---
  await payload.update({ collection: 'product-requests', id: reqDoc.id, data: { status: 'approved' } });
  await new Promise((r) => setTimeout(r, 400));
  const afterApprove = await genJobs();
  ok(afterApprove === 1, `approval enqueues exactly one generation job (got ${afterApprove})`);
  const r1 = await payload.findByID({ collection: 'product-requests', id: reqDoc.id, depth: 1 }) as any;
  ok(r1.status === 'processing', 'approved request moves to processing');
  ok(!!r1.generationJobId, 'approved request stores the job id');
  ok(!!r1.linkedProduct, 'approved request links a product');
  const prod = typeof r1.linkedProduct === 'object' ? r1.linkedProduct : await payload.findByID({ collection: 'products', id: r1.linkedProduct });
  ok(prod.affiliateUrl === 'https://aff.example.com/p?tag=etk-20', 'linked product carries the manually-entered affiliate URL');
  ok(prod.status === 'draft', 'linked product is draft (Products hook does not double-enqueue)');

  // --- idempotency: re-saving an approved request enqueues NO additional job ---
  await payload.update({ collection: 'product-requests', id: reqDoc.id, data: { notes: 're-saved' } });
  await new Promise((r) => setTimeout(r, 300));
  const afterResave = await genJobs();
  ok(afterResave === 1, `re-saving approved request does NOT enqueue another job (still ${afterResave})`);

  // --- affiliate CTA uses the stored affiliate URL + safe attributes + image handling ---
  const article = { id: 9, product: { id: 5, title: 'Test Widget', affiliateUrl: 'https://aff.example.com/x', merchantName: 'Amazon' }, images: {} } as any;
  const html = renderToStaticMarkup(React.createElement(AffiliateCTA, { article, placement: 'after-intro' }));
  ok(html.includes('https://aff.example.com/x'), 'CTA renders the stored affiliate URL');
  ok(html.includes('rel="sponsored nofollow noopener"'), 'CTA link uses rel="sponsored nofollow noopener"');
  ok(html.includes('data-product-id="5"') && html.includes('data-article-id="9"'), 'CTA carries product/article ids for tracking');
  ok(html.includes('class="ctaimg"'), 'CTA renders an image placeholder when no image is set (no crash)');

  const withImg = { ...article, images: { product: { url: '/media/x.jpg' } } } as any;
  ok(renderToStaticMarkup(React.createElement(AffiliateCTA, { article: withImg, placement: 'x' })).includes('/media/x.jpg'), 'CTA renders the product image when present');

  const noUrl = { id: 1, product: { id: 2, title: 'No Link' }, images: {} } as any;
  ok(renderToStaticMarkup(React.createElement(AffiliateCTA, { article: noUrl, placement: 'x' })) === '', 'CTA renders nothing when no affiliate URL exists');

  console.log(fails ? `\nINTAKE_RESULT=FAIL (${fails})` : '\nINTAKE_RESULT=PASS');
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error('INTAKE_ERR', e?.stack || e); process.exit(1); });
