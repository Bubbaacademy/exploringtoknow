/* Offline functional-validation harness: real embedded Postgres + Payload local API,
   running the SAME validateOneArticle path (mock AI unless a key is present). */
import EmbeddedPostgres from 'embedded-postgres';

async function main() {
  const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata_ryze', user: 'etk', password: 'etk', port: 5433, persistent: false });
  await pg.initialise(); await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }
  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5433/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret'; process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development'; process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3000';

  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { loadBrandProfile } = await import('../src/lib/brand');
  const { validateOneArticle } = await import('./lib/validation');
  const payload = await getPayload({ config });
  const brandProfile = await loadBrandProfile(payload);

  const r = await validateOneArticle(payload, {
    brand: { name: 'RYZE', slug: 'ryze' },
    product: { id: 'pending', title: 'RYZE Mushroom Coffee', slug: 'ryze-mushroom-coffee',
      offerType: 'amazon_affiliate', notes: 'Mushroom coffee; focus + calm energy.' },
    brandProfile, outDir: process.env.REPORT_DIR || '/tmp',
  });
  console.log('LOCAL_VALIDATION', JSON.stringify(r));
  process.exit(0);
}
main().catch((e) => { console.error('FAIL', e?.message || e); process.exit(1); });
