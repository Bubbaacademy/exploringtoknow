/* REST persistence integration test (Approach B).
 *
 * Exercises the EXACT worker code path — generateAndPersist() →
 * RestPersistenceClient → persistGeneration() — over real HTTP against a real
 * embedded Postgres + Payload. A thin delegating HTTP server maps Payload REST
 * routes onto the Local API instance, so the client's request/response handling
 * and the full persistence write set are validated end-to-end. Mock AI (no key).
 */
import EmbeddedPostgres from 'embedded-postgres';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

const ok = (b: boolean, m: string) => {
  console.log(`${b ? 'PASS' : 'FAIL'}  ${m}`);
  if (!b) process.exitCode = 1;
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
  });
}

/** where[field][op]=value  ->  { field: { op: value } } */
function parseWhere(params: URLSearchParams): Record<string, unknown> {
  const where: Record<string, Record<string, unknown>> = {};
  for (const [key, val] of params.entries()) {
    const m = key.match(/^where\[(.+?)\]\[(.+?)\]$/);
    if (m) {
      const field = m[1] as string;
      const op = m[2] as string;
      (where[field] ??= {})[op] = val;
    }
  }
  return where;
}

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: '/tmp/pgdata_wrest', user: 'etk', password: 'etk', port: 5439, persistent: false,
  });
  await pg.initialise();
  await pg.start();
  try { await pg.createDatabase('exploringtoknow'); } catch { /* exists */ }

  process.env.DATABASE_URL = 'postgres://etk:etk@127.0.0.1:5439/exploringtoknow';
  process.env.PAYLOAD_SECRET = 'devsecret';
  process.env.AUTH_SECRET = 'dev';
  process.env.NODE_ENV = 'development';
  process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3000';

  const { getPayload } = await import('payload');
  const config = (await import('../src/payload.config')).default;
  const { RestPersistenceClient, generateAndPersist } = await import('@etk/persistence');

  const payload = await getPayload({ config });

  // --- delegating REST server: Payload REST routes -> Local API ---
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const parts = url.pathname.split('/').filter(Boolean); // ['api', <collection|globals>, ...]
      const send = (code: number, obj: unknown) => {
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
      };
      if (parts[0] !== 'api') return send(404, { error: 'not_found' });

      // /api/globals/:slug
      if (parts[1] === 'globals' && parts[2]) {
        const g = await payload.findGlobal({ slug: parts[2] });
        return send(200, g);
      }

      const collection = parts[1] as string;
      const id = parts[2];

      if (req.method === 'GET' && id) {
        try {
          const doc = await payload.findByID({ collection, id });
          return send(200, doc);
        } catch { return send(404, { error: 'not_found' }); }
      }
      if (req.method === 'GET') {
        const r = await payload.find({ collection, where: parseWhere(url.searchParams), limit: 1 });
        return send(200, r);
      }
      if (req.method === 'POST') {
        const data = JSON.parse((await readBody(req)) || '{}');
        const doc = await payload.create({ collection, data });
        return send(201, { doc });
      }
      if (req.method === 'PATCH' && id) {
        const data = JSON.parse((await readBody(req)) || '{}');
        const doc = await payload.update({ collection, id, data });
        return send(200, { doc });
      }
      return send(405, { error: 'method_not_allowed' });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });

  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // --- seed an existing product (the worker loads it by id) ---
  const brand = await payload.create({ collection: 'brands', data: { name: 'RestTest', slug: 'rest-test' } });
  // status 'draft' so the Products.afterChange hook does NOT enqueue / start
  // pg-boss in this harness — the worker loads the product by id regardless.
  const product = await payload.create({
    collection: 'products',
    data: { title: 'REST Wiring Test Widget', slug: 'rest-wiring-test-widget',
            offerType: 'amazon_affiliate', status: 'draft', priority: 50, brand: brand.id },
  });

  console.log('\n===== WORKER REST PERSISTENCE VERIFICATION =====');
  ok(true, `delegating Payload REST server listening on ${baseUrl}`);

  // --- run the EXACT worker path over REST ---
  const client = new RestPersistenceClient({ baseUrl, apiKey: 'test', authCollection: 'users' });
  const saved = await generateAndPersist(client, { productId: product.id }, { maxAttempts: 2 });

  ok(!!saved.runId, 'generation-runs row created (via REST)');
  ok(!!saved.intelligenceId, 'product-intelligence persisted (via REST)');
  ok(!!saved.briefId, 'content-briefs persisted (via REST)');
  ok(!!saved.articleId, 'article persisted (via REST)');
  ok(saved.articleStatus === 'published', `article status=published (got ${saved.articleStatus})`);

  // --- independently confirm rows landed in the DB ---
  const intel = await payload.find({ collection: 'product-intelligence', where: { product: { equals: product.id } }, limit: 1 });
  ok(intel.totalDocs === 1, 'DB: product-intelligence row exists for product');
  const briefs = await payload.find({ collection: 'content-briefs', where: { product: { equals: product.id } }, limit: 1 });
  ok(briefs.totalDocs === 1, 'DB: content-briefs row exists for product');
  const arts = await payload.find({ collection: 'articles', where: { product: { equals: product.id } }, limit: 1 });
  ok(arts.totalDocs === 1 && (arts.docs[0] as any)?.status === 'published', 'DB: article row exists + published');
  const runs = await payload.find({ collection: 'generation-runs', where: { product: { equals: product.id } }, limit: 1 });
  const runDoc = runs.docs[0] as any;
  ok(runs.totalDocs === 1, 'DB: generation-runs ledger row exists');
  ok(typeof runDoc?.totalTokens === 'number' && runDoc?.status === 'published',
    `DB: run ledger finalized (status=${runDoc?.status}, tokens=${runDoc?.totalTokens})`);

  console.log(process.exitCode ? '\nRESULT: FAIL' : '\nRESULT: PASS');
  // Exit directly (same pattern as preflight.ts): process teardown reclaims the
  // HTTP server and the embedded Postgres child. Calling pg.stop() here would
  // fast-shutdown the DB while Payload's pg pool is still connected, surfacing an
  // unhandled pool 'error' (57P01) — a teardown artifact, not a persistence issue.
  process.exit(process.exitCode ?? 0);
}

main().catch((e) => { console.error('FAIL', e?.stack || e); process.exit(1); });
