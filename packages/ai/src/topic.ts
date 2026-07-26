import type { ArticleType, BrandProfile, GeneratedArticle } from '@etk/core';
import { DEFAULT_BRAND } from '@etk/core';
import { registry } from '@etk/prompts';
import { CostMeter, resolveProvider } from '@etk/providers';
import { ARTICLE_SCHEMA } from './schemas';

/**
 * Phase 2U — TOPIC-driven article generation.
 *
 * The existing `runContentPipeline` is PRODUCT-driven: it needs a Products
 * record and its prompt (article_generation@2) injects `PRODUCT: …`, forces an
 * affiliate disclosure and CTA, and asks for a product-vs-DIY comparison. That
 * is right for a review and wrong for a how-to about storing herbs — most of
 * the magazine's seed set has no single product behind it.
 *
 * This module is the smallest correct addition: same provider, same model
 * resolution (read from the registered article prompt's metadata, so model
 * choice stays centralized) and the same structured-output contract, but with
 * an editorial system prompt that carries the magazine's actual standards.
 *
 * The prompt text lives here rather than in `@etk/prompts` deliberately — it is
 * one MVP prompt and registering a new PromptCategory would mean editing the
 * prompts package's type union. Promote it to `@etk/prompts` when a second
 * topic prompt appears.
 */
export interface TopicSpec {
  /** Working title. The model may refine it; keep it concrete. */
  title: string;
  articleType: ArticleType;
  /** What the reader is actually trying to solve. */
  angle: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  audience?: string;
  /** Facts, constraints or an outline the writer must stay inside. */
  notes?: string;
  /** Claims this piece must not make (health, safety, testing, …). */
  avoid?: string[];
}

export interface TopicResult {
  article: GeneratedArticle;
  cost: ReturnType<CostMeter['report']>;
}

/** Editorial standards, stated once. These mirror the rules already enforced by the publish gate. */
const EDITORIAL_RULES = [
  'Helpful first: open with the reader\'s real problem, not a product.',
  'Human voice: vary sentence length; plain language; contractions are fine.',
  'AVOID AI tells — no "In today\'s world", "fast-paced", "Whether you\'re", "Look no further", "When it comes to", "In conclusion", no filler transitions, no robotic parallel lists.',
  'NEVER claim hands-on testing, measurement, lab work or first-person trial. You did not test anything.',
  'NO medical, health, safety, dermatological, infant-care, food-safety, electrical-safety, durability or performance claims. Where a topic touches one, describe rather than advise and point the reader to the manufacturer, a professional, or current official guidance.',
  'NO fabricated specifications, prices, wattage, capacity, dimensions, shelf life, certifications or statistics. If a figure matters, tell the reader where to look it up instead of inventing it.',
  'NO "best" as an unsupported claim. If you rank or select, state the selection criteria first.',
  'NO placeholder text of any kind. Never emit TEST, zzz, lorem ipsum, TODO, VERIFY or {PRODUCT}.',
  'NO SaaS, seller, creator or marketplace calls to action. This is a reader-facing magazine, not a platform.',
  'Do not write an affiliate disclosure or an affiliate CTA — the site renders disclosure automatically when a product is linked.',
  'Hedge honestly: "generally", "tends to", "commonly advised" rather than asserted universals.',
];

function buildPrompt(spec: TopicSpec, brand: BrandProfile) {
  const secondary = spec.secondaryKeywords?.length ? spec.secondaryKeywords.join(', ') : '(none)';
  return {
    system:
      `You are a senior editorial writer for ${brand.name || 'an independent consumer magazine'}, ` +
      'a trusted, independent recommendation site. You write genuinely useful, accurate, human articles ' +
      'that earn reader trust. The magazine\'s standing promise to readers is "Independently researched, ' +
      'human-reviewed" — never imply more than that.\n\nRULES:\n' +
      EDITORIAL_RULES.map((r) => `- ${r}`).join('\n') +
      '\n\nReturn ONLY valid minified JSON. No prose outside the JSON.',
    prompt:
      `Write a complete, publish-ready ${spec.articleType} article for a consumer magazine.\n` +
      `WORKING TITLE: ${spec.title}\n` +
      `ANGLE: ${spec.angle}\n` +
      `PRIMARY KEYWORD: ${spec.primaryKeyword || spec.title}\n` +
      `SECONDARY KEYWORDS: ${secondary}\n` +
      (spec.audience ? `AUDIENCE: ${spec.audience}\n` : '') +
      (spec.notes ? `\nGROUND THE ARTICLE IN THESE NOTES — do not invent beyond them:\n${spec.notes}\n` : '') +
      (spec.avoid?.length ? `\nCLAIMS TO AVOID (hard constraints):\n- ${spec.avoid.join('\n- ')}\n` : '') +
      '\nThis article has NO single product behind it. Do not invent one, do not name brands you were ' +
      'not given, and do not write a product pitch. Where products are relevant, discuss them as ' +
      'categories and give the reader selection criteria they can apply themselves.\n' +
      '\nStructure: a short honest intro, H2 sections with H3 sub-steps where useful, practical decision ' +
      'guidance, and a closing summary. Aim for roughly 1,000-1,400 words — thorough, not padded.\n' +
      '\nReturn JSON keys: title (concise and human), type (=' + spec.articleType + '), markdown (the full ' +
      'article body in Markdown, H2/H3, NO H1 — the site renders the title), metaTitle (<=60 chars), ' +
      'metaDescription (140-165 chars, a complete sentence), sections (array of the H2 headings used).',
  };
}

/**
 * Generate one topic-driven article. Mirrors `articleNode`: same structured
 * output contract and the same mock fallback shape when no provider key is set,
 * so callers behave identically with or without credentials.
 */
export async function generateTopicArticle(
  spec: TopicSpec,
  brand: BrandProfile = DEFAULT_BRAND,
): Promise<TopicResult> {
  const meta = registry.get('article_generation').metadata;
  const provider = resolveProvider(meta.suggestedProvider, meta.suggestedModel);
  const { system, prompt } = buildPrompt(spec, brand);

  const mock: GeneratedArticle = {
    title: spec.title,
    type: spec.articleType,
    markdown:
      `## ${spec.angle}\n\nMock body generated without a provider key.\n\n` +
      `## What to consider\nSelection criteria the reader can apply.\n\n` +
      `## The bottom line\nA short honest summary.\n`,
    metaTitle: spec.title.slice(0, 60),
    metaDescription: `${spec.angle}`.slice(0, 155),
    sections: [spec.angle, 'What to consider', 'The bottom line'],
  };

  const res = await provider.completeStructured<GeneratedArticle>({
    system,
    prompt,
    schemaName: 'GeneratedArticle',
    outputSchema: ARTICLE_SCHEMA,
    maxTokens: 8192,
    mock,
  });

  const meter = new CostMeter();
  meter.record('article_topic', res.model, res.usage);

  return { article: res.data, cost: meter.report() };
}
