import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import type { ProductInput } from '@etk/core';
import { runContentPipeline } from '@etk/ai';
import { registry } from '@etk/prompts';
import { loadBrandProfile } from '../src/lib/brand';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

/**
 * LIVE end-to-end run for the golden product using Payload's LOCAL API.
 *   load product + brand → run pipeline (real models if keys present) →
 *   persist intelligence, brief, article + generation-runs cost ledger.
 */
async function main() {
  const payload = await getPayload({ config });
  const startedAt = new Date();

  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'block-led-lights-bedroom' } },
    limit: 1,
  });
  const product = found.docs[0];
  if (!product) throw new Error('golden product not found — run seed-golden first');

  const brand = await loadBrandProfile(payload);

  const input: ProductInput = {
    id: String(product.id),
    title: product.title as string,
    offerType: product.offerType as ProductInput['offerType'],
    notes: 'Reduces blue light at night.',
  };

  // create the run ledger up front
  const run = await payload.create({
    collection: 'generation-runs',
    data: { product: product.id, status: 'running', startedAt: startedAt.toISOString(),
            promptVersions: registry.list().map((p) => p.id) },
  });

  const result = await runContentPipeline(input, brand, { maxAttempts: 2 });
  const s = result.state;

  // persist intelligence
  const intel = await payload.create({
    collection: 'product-intelligence',
    data: { product: product.id, ...s.intelligence,
            model: result.cost.steps.find((x) => x.label === 'intelligence')?.model,
            generatedAt: new Date().toISOString() },
  });

  // persist brief
  const brief = await payload.create({
    collection: 'content-briefs',
    data: { product: product.id, intelligence: intel.id, ...s.brief, status: 'ready' },
  });

  // persist article
  const passed = Boolean(s.qa?.passed);
  const article = s.article
    ? await payload.create({
        collection: 'articles',
        data: {
          title: s.article.title,
          slug: slugify(s.article.title) || `${product.slug}-article`,
          brief: brief.id, product: product.id, type: s.article.type,
          markdown: s.article.markdown,
          seo: { metaTitle: s.article.metaTitle, metaDescription: s.article.metaDescription },
          qaReport: { passed, reasons: s.qa?.reasons ?? [] },
          status: passed ? 'qa' : 'flagged',
        },
      })
    : null;

  // finalize run ledger
  await payload.update({
    collection: 'generation-runs', id: run.id,
    data: {
      status: result.flagged ? 'flagged' : (passed ? 'published' : 'failed'),
      articleAttempts: s.attempts.article,
      totalTokens: result.cost.totalTokens,
      costUsdCents: result.cost.totalCents,
      steps: result.cost.steps,
      finishedAt: new Date().toISOString(),
    },
  });

  console.log(JSON.stringify({
    productId: product.id, intelligenceId: intel.id, briefId: brief.id,
    articleId: article?.id, qaPassed: passed, flagged: result.flagged,
    totalTokens: result.cost.totalTokens, costUsdCents: result.cost.totalCents,
    mockMode: !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY,
  }, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
