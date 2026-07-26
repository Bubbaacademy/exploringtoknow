/**
 * Phase 2U — gated publisher. Plain ESM, fetch only, no dependencies.
 *
 *   node publish-article.mjs <slug> [--dry-run]
 *
 * Runs inside etk-worker (or anything with PAYLOAD_INTERNAL_URL +
 * WORKER_PAYLOAD_API_KEY). Writes go through the Payload REST API, so every
 * collection hook — editorial gate, tenant stamping, publish-date stamping —
 * still runs. No SQL, no schema, no deploy.
 *
 * Publish order is FIXED and never reversed:
 *   gate → editorialStatus=published → confirm editorialPublishedAt → status=published
 */
import { evaluate, formatResult } from './publish-gate.mjs';

const BASE = process.env.PAYLOAD_INTERNAL_URL || 'http://app:3000';
const KEY = process.env.WORKER_PAYLOAD_API_KEY || '';
const H = { 'Content-Type': 'application/json', Authorization: `users API-Key ${KEY}` };

const slug = process.argv[2];
const DRY = process.argv.includes('--dry-run');

if (!slug) {
  console.error('usage: node publish-article.mjs <slug> [--dry-run]');
  process.exit(2);
}
if (!KEY) {
  console.error('WORKER_PAYLOAD_API_KEY is not set in this environment.');
  process.exit(2);
}

const api = async (path, init) => {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: H });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: res.status, json };
};

const findBySlug = async () => {
  const r = await api(`/api/articles?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=1`);
  if (r.status !== 200) throw new Error(`article lookup failed: ${r.status}`);
  return r.json.totalDocs > 0 ? r.json.docs[0] : null;
};

const idOf = (rel) => (rel && typeof rel === 'object' ? (rel.id ?? null) : (rel ?? null));

(async () => {
  const article = await findBySlug();
  if (!article) { console.error(`no article with slug "${slug}"`); process.exit(1); }

  // ---- assemble the gate bundle -------------------------------------------
  const heroId = idOf(article.images?.hero);
  let hero = null;
  if (heroId != null) {
    const r = await api(`/api/media/${heroId}?depth=0`);
    if (r.status === 200) hero = r.json;
  }

  const productId = idOf(article.product);
  let product = null;
  let productMediaIds = [];
  let productPermissionConfirmed = false;
  if (productId != null) {
    const r = await api(`/api/products/${productId}?depth=1`);
    if (r.status === 200) {
      product = r.json;
      const imgs = Array.isArray(product.productImages) ? product.productImages : [];
      productMediaIds = imgs
        .filter((x) => x?.enabled !== false)
        .map((x) => idOf(x?.image ?? x))
        .filter((x) => x != null)
        .map(Number);
    }
    // Permission provenance: an approved product request carrying
    // imagePermissionConfirmed proves the seller owns or was granted use of
    // these images. NOTE: /api/product-requests is not exposed over REST (405),
    // so this lookup is best-effort — when it is unavailable the gate falls back
    // to Media.source, which the approval flow stamps with an internal
    // permission marker for exactly these images.
    const pr = await api(
      `/api/product-requests?where[linkedProduct][equals]=${productId}` +
      `&where[imagePermissionConfirmed][equals]=true&limit=1&depth=0`,
    );
    if (pr.status === 200 && pr.json.totalDocs > 0) productPermissionConfirmed = true;
  }

  const cats = await api('/api/categories?limit=200&depth=0');
  const knownCategorySlugs = cats.status === 200 ? cats.json.docs.map((d) => String(d.slug)) : [];

  // ---- gate ----------------------------------------------------------------
  const result = evaluate({ article, hero, product, knownCategorySlugs, productMediaIds, productPermissionConfirmed });
  console.log(formatResult(slug, result));
  console.log(`  (id=${article.id} type=${article.type} editorial=${article.editorialStatus} pipeline=${article.status} md=${String(article.markdown || '').length})`);
  console.log(`  (product=${productId ?? 'none'} productMedia=${productMediaIds.length} permissionConfirmed=${productPermissionConfirmed} hero=${idOf(article.images?.hero) ?? 'none'})`);

  if (!result.ok) {
    console.log('\nNOT PUBLISHED — article left exactly as it was.');
    process.exit(1);
  }
  if (DRY) { console.log('\n--dry-run: gate passed, no write performed.'); process.exit(0); }

  if (article.editorialStatus === 'published') {
    console.log('\nAlready editorially published; ensuring pipeline status only.');
  } else {
    // ---- STEP 1: editorial status ------------------------------------------
    const w1 = await api(`/api/articles/${article.id}`, {
      method: 'PATCH', body: JSON.stringify({ editorialStatus: 'published' }),
    });
    if (w1.status >= 400) { console.error('publish failed:', w1.status, JSON.stringify(w1.json).slice(0, 500)); process.exit(1); }
    console.log('STEP 1 editorialStatus=published →', w1.status);
  }

  // ---- STEP 2: confirm the public publish date stamped --------------------
  const mid = (await api(`/api/articles/${article.id}?depth=0`)).json;
  if (mid.editorialStatus !== 'published') { console.error('ABORT: editorialStatus did not stick.'); process.exit(1); }
  if (!mid.editorialPublishedAt) { console.error('ABORT: editorialPublishedAt did not stamp — not touching pipeline status.'); process.exit(1); }
  console.log('STEP 2 editorialPublishedAt =', mid.editorialPublishedAt);

  // ---- STEP 3: pipeline status, only now ----------------------------------
  const w2 = await api(`/api/articles/${article.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'published' }) });
  if (w2.status >= 400) { console.error('pipeline status update failed:', w2.status); process.exit(1); }
  console.log('STEP 3 pipeline status=published →', w2.status);

  const after = (await api(`/api/articles/${article.id}?depth=0`)).json;
  console.log('\nPUBLISHED:', JSON.stringify({
    id: after.id, slug: after.slug, editorialStatus: after.editorialStatus,
    pipelineStatus: after.status, editorialPublishedAt: after.editorialPublishedAt,
    featured: after.featured,
  }));
})().catch((e) => { console.error('fatal:', e?.message || e); process.exit(1); });
