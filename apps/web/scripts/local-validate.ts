/* Offline validation: real embedded Postgres + Payload local API, FLANCCI case,
   same validateOneArticle path (mock AI unless a key is present). */
import EmbeddedPostgres from 'embedded-postgres';

async function main() {
  const pg = new EmbeddedPostgres({ databaseDir: '/tmp/pgdata_flancci', user: 'etk', password: 'etk', port: 5434, persistent: false });
  await pg.initialise(); await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }
  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5434/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret'; process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development'; process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3000';

  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { loadBrandProfile } = await import('../src/lib/brand');
  const { validateOneArticle } = await import('./lib/validation');
  const { FLANCCI_CASE } = await import('./cases/flancci');
  const payload = await getPayload({ config });
  const brandProfile = await loadBrandProfile(payload);
  const r = await validateOneArticle(payload, {
    brand: FLANCCI_CASE.brand, product: FLANCCI_CASE.product, brandProfile,
    outDir: process.env.REPORT_DIR || '/tmp',
  });
  console.log('LOCAL_VALIDATION', JSON.stringify(r));
  process.exit(0);
}
main().catch((e) => { console.error('FAIL', e?.message || e); process.exit(1); });
