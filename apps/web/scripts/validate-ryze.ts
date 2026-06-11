import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import type { ProductInput } from '@etk/core';
import { runContentPipeline } from '@etk/ai';
import { registry } from '@etk/prompts';
import { loadBrandProfile } from '../src/lib/brand';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

async function findOrCreate(payload: any, collection: string, where: any, data: any) {
  const found = await payload.find({ collection, where, limit: 1 });
  if (found.docs[0]) return found.docs[0];
  return payload.create({ collection, data });
}

/**
 * PHASE B — single controlled functional validation: RYZE Mushroom Coffee.
 * brand → product → intelligence → brief → article → publish, all via Payload's
 * local API (NO manual DB edits). Idempotent. Prints IDs + the public URL.
 *   pnpm --filter @etk/web validate:ryze
 */
async function main() {
  const payload = await getPayload({ config });

  // 1. Brand
  const brandDoc = await findOrCreate(payload, 'brands',
    { slug: { equals: 'ryze' } },
    { name: 'RYZE', slug: 'ryze', description: 'Mushroom coffee brand.', website: 'https://ryzesuperfoods.com' });

  // 2. Product
  const productSlug = 'ryze-mushroom-coffee';
  const productDoc = await findOrCreate(payload, 'products',
    { slug: { equals: productSlug } },
    { title: 'RYZE Mushroom Coffee', slug: productSlug, offerType: 'amazon_affiliate',
      status: 'active', priority: 100, brand: brandDoc.id, typeFields: {} });

  const brand = await loadBrandProfile(payload);
  const input: ProductInput = {
    id: String(productDoc.id), title: productDoc.title as string,
    offerType: productDoc.offerType as ProductInput['offerType'],
    brand: 'RYZE', categories: ['coffee', 'wellness'],
    notes: 'Mushroom coffee blend; lower caffeine; marketed for focus and calm energy.',
  };

  const run = await payload.create({ collection: 'generation-runs',
    data: { product: productDoc.id, status: 'running', startedAt: new Date().toISOString(),
            promptVersions: registry.list().map((p) => p.id) } });

  // 3-5. Intelligence → Brief → Article (+ QA)
  const result = await runContentPipeline(input, brand, { maxAttempts: 2 });
  const s = result.state;
  const passed = Boolean(s.qa?.passed);

  // 6. Persist intelligence + brief + article
  const intel = await payload.create({ collection: 'product-intelligence',
    data: { product: productDoc.id, ...s.intelligence,
            model: result.cost.steps.find((x) => x.label === 'intelligence')?.model,
            generatedAt: new Date().toISOString() } });
  const brief = await payload.create({ collection: 'content-briefs',
    data: { product: productDoc.id, intelligence: intel.id, ...s.brief, status: 'ready' } });

  const articleSlug = `${slugify(s.article?.title ?? 'ryze-mushroom-coffee')}`;
  const article = s.article ? await payload.create({ collection: 'articles',
    data: {
      title: s.article.title, slug: articleSlug, brief: brief.id, product: productDoc.id,
      type: s.article.type, markdown: s.article.markdown,
      seo: { metaTitle: s.article.metaTitle, metaDescription: s.article.metaDescription },
      openGraph: { title: s.article.title, description: s.article.metaDescription },
      qaReport: { passed, reasons: s.qa?.reasons ?? [] },
      // PUBLISH so it renders on the public site (QA passed) else flagged
      status: passed ? 'published' : 'flagged',
      publishedAt: passed ? new Date().toISOString() : undefined,
    } }) : null;

  await payload.update({ collection: 'generation-runs', id: run.id,
    data: { status: result.flagged ? 'flagged' : (passed ? 'published' : 'failed'),
            articleAttempts: s.attempts.article, totalTokens: result.cost.totalTokens,
            costUsdCents: result.cost.totalCents, steps: result.cost.steps,
            finishedAt: new Date().toISOString() } });

  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000';
  console.log(JSON.stringify({
    brandId: brandDoc.id, productId: productDoc.id, intelligenceId: intel.id,
    briefId: brief.id, articleId: article?.id, articleStatus: article?.status,
    qaPassed: passed, mockMode: !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY,
    adminUrl: `${base}/admin/collections/articles/${article?.id}`,
    publicUrl: `${base}/${articleSlug}`,
    totalTokens: result.cost.totalTokens, costUsdCents: result.cost.totalCents,
  }, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
