import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import type { ProductInput } from '@etk/core';
import { runContentPipeline } from '@etk/ai';
import { GOLDEN_ANGLES, buildReport, type EvalPiece } from '@etk/eval';
import { loadBrandProfile } from '../src/lib/brand';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

/**
 * Golden Product Validation — HOST runner (Payload local API).
 * Generates 10 angle pieces with REAL models (set ANTHROPIC_API_KEY), persists
 * intelligence/brief/article + generation-runs for EACH, then writes the report.
 *   pnpm --filter @etk/web golden:batch
 */
async function main() {
  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: 'products', where: { slug: { equals: 'block-led-lights-bedroom' } }, limit: 1,
  });
  const product = found.docs[0];
  if (!product) throw new Error('golden product not found — run seed:golden first');
  const brand = await loadBrandProfile(payload);

  const pieces: EvalPiece[] = [];
  for (const angle of GOLDEN_ANGLES) {
    const input: ProductInput = {
      id: String(product.id), title: product.title as string,
      offerType: product.offerType as ProductInput['offerType'],
      notes: `Focus: ${angle.focus}.`,
    };
    const run = await payload.create({
      collection: 'generation-runs',
      data: { product: product.id, status: 'running', startedAt: new Date().toISOString() },
    });

    const r = await runContentPipeline(input, brand, { maxAttempts: 2 });
    const s = r.state;
    const passed = Boolean(s.qa?.passed);

    const intel = await payload.create({
      collection: 'product-intelligence',
      data: { product: product.id, ...s.intelligence,
              model: r.cost.steps.find((x) => x.label === 'intelligence')?.model,
              generatedAt: new Date().toISOString() },
    });
    const brief = await payload.create({
      collection: 'content-briefs',
      data: { product: product.id, intelligence: intel.id, ...s.brief, status: 'ready' },
    });
    if (s.article) {
      await payload.create({
        collection: 'articles',
        data: {
          title: s.article.title,
          slug: `${slugify(s.article.title) || product.slug}-${angle.key}`,
          brief: brief.id, product: product.id, type: s.article.type, markdown: s.article.markdown,
          seo: { metaTitle: s.article.metaTitle, metaDescription: s.article.metaDescription },
          qaReport: { passed, reasons: s.qa?.reasons ?? [] },
          status: passed ? 'qa' : 'flagged',
        },
      });
    }
    await payload.update({
      collection: 'generation-runs', id: run.id,
      data: { status: r.flagged ? 'flagged' : (passed ? 'published' : 'failed'),
              articleAttempts: s.attempts.article, totalTokens: r.cost.totalTokens,
              costUsdCents: r.cost.totalCents, steps: r.cost.steps, finishedAt: new Date().toISOString() },
    });

    pieces.push({
      angleKey: angle.key, title: s.article?.title ?? '(none)', type: s.article?.type ?? angle.type,
      markdown: s.article?.markdown ?? '', metaTitle: s.article?.metaTitle ?? '',
      metaDescription: s.article?.metaDescription ?? '', primaryKeyword: s.brief?.primaryKeyword ?? '',
      qaPassed: passed, costCents: r.cost.totalCents, tokens: r.cost.totalTokens,
    });
    console.log(`[${angle.key}] qa=${passed} tokens=${r.cost.totalTokens} cost¢=${r.cost.totalCents}`);
  }

  const mock = !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY;
  writeFileSync('CONTENT_EVALUATION_REPORT.md', buildReport(pieces, brand, { mock }));
  console.log(`\nPersisted ${pieces.length} pieces to Payload; wrote CONTENT_EVALUATION_REPORT.md (mock=${mock})`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
