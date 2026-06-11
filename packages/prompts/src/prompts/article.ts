import type { PromptDef } from '../types';
import type { ProductInput, ContentBrief, BrandProfile } from '@etk/core';
import { brandPreamble } from '../brand';

export interface ArticleVars {
  product: ProductInput;
  brief: ContentBrief;
  brand: BrandProfile;
  feedback?: string[];
}

export const articleV1: PromptDef<ArticleVars> = {
  id: 'article_generation@1',
  category: 'article_generation',
  version: 1,
  description: 'Write a full editorial article from a brief, in a trustworthy review-site voice.',
  metadata: {
    author: 'etk', createdAt: '2026-06-10', tags: ['article', 'longform'],
    suggestedProvider: 'claude', suggestedModel: 'claude-opus-4-8',
    outputContract: 'JSON GeneratedArticle: title, type, markdown, metaTitle, metaDescription, sections[]',
  },
  render: ({ product, brief, brand, feedback }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are a senior editorial writer for a high-trust product review site. Write helpful, specific, ' +
      'non-hyperbolic content. Include the affiliate disclosure as instructed. Return ONLY valid minified JSON.',
    prompt:
      `Write a ${brief.articleType} article.\n` +
      `TITLE: ${brief.chosenTitle}\n` +
      `ANGLE: ${brief.angle}\n` +
      `PRIMARY KEYWORD: ${brief.primaryKeyword}\n` +
      `SECONDARY: ${brief.secondaryKeywords.join(', ')}\n` +
      `CTA STRATEGY: ${brief.ctaStrategy}\n` +
      `AFFILIATE PLACEMENT: ${brief.affiliatePlacement}\n` +
      `PRODUCT: ${product.title} (${product.offerType})\n` +
      (feedback?.length ? `\nREVISE PER FEEDBACK:\n- ${feedback.join('\n- ')}\n` : '') +
      `\nReturn JSON keys: title, type (=${brief.articleType}), markdown (full article, H2/H3 + ` +
      `affiliate disclosure + CTA), metaTitle (<=60 chars), metaDescription (<=155 chars), ` +
      `sections (array of the H2 headings used).`,
  }),
};

export const articleV2: PromptDef<ArticleVars> = {
  id: 'article_generation@2',
  category: 'article_generation',
  version: 2,
  description: 'Production-grade article: helpful-first, EEAT, human voice, honest, SEO without stuffing.',
  metadata: {
    author: 'etk', createdAt: '2026-06-11', tags: ['article', 'production', 'eeat'],
    suggestedProvider: 'claude', suggestedModel: 'claude-opus-4-8',
    outputContract: 'JSON GeneratedArticle: title, type, markdown, metaTitle, metaDescription, sections[]',
  },
  render: ({ product, brief, brand, feedback }) => ({
    system:
      `${brandPreamble(brand)}\n\n` +
      'You are a seasoned writer/editor for a trusted, independent product-recommendation site ' +
      '(Wirecutter / The Spruce / LoveToKnow quality). Write genuinely helpful, accurate, human content ' +
      'that earns reader trust (EEAT).\n' +
      'RULES:\n' +
      '- Helpful first: open with the reader’s real problem and a useful answer, not the product.\n' +
      '- Human voice: vary sentence length and rhythm; plain language; contractions ok. AVOID AI tells — ' +
      'no "In today’s world", "fast-paced", "Whether you’re", "Look no further", "When it comes to", ' +
      '"In conclusion", no robotic parallel lists, no filler transitions.\n' +
      '- EEAT: show real understanding; be specific and practical; acknowledge trade-offs and limitations honestly.\n' +
      '- Honesty: NO fabricated testing, lab results, ratings, or first-person "I tested" claims unless provided; ' +
      'NO fake statistics; NO exaggerated marketing. Only claims true of the product category.\n' +
      '- SEO without stuffing: primary keyword naturally in title, intro, and one H2; related terms where they fit.\n' +
      '- Affiliate done right: plain disclosure near the top; explain who it is and isn’t for; one low-pressure CTA.\n' +
      'Return ONLY valid minified JSON. No prose outside JSON.',
    prompt:
      `Write a complete, publish-ready ${brief.articleType} article that solves the reader’s problem.\n` +
      `WORKING TITLE: ${brief.chosenTitle}\n` +
      `ANGLE: ${brief.angle}\n` +
      `PRIMARY KEYWORD: ${brief.primaryKeyword}\n` +
      `SECONDARY: ${brief.secondaryKeywords.join(', ')}\n` +
      `CTA STRATEGY: ${brief.ctaStrategy}\n` +
      `AFFILIATE PLACEMENT: ${brief.affiliatePlacement}\n` +
      `PRODUCT: ${product.title} (${product.offerType})\n` +
      (product.notes ? `PRODUCT FACTS & USE CASES (ground the article in these; do not invent beyond them):\n${product.notes}\n` : '') +
      (feedback?.length ? `\nREVISE PER FEEDBACK:\n- ${feedback.join('\n- ')}\n` : '') +
      `\nMUST: address the specific real-world problems surfaced above; include a practical, honest ` +
      `COMPARISON of this product approach vs common DIY alternatives (electrical tape, unplugging, ` +
      `blackout fixes) — strengths AND weaknesses of each; include a short FAQ; end with an honest ` +
      `recommendation (who it’s for / not for) + one CTA. Aim ~1,000–1,400 words; thorough, not padded.\n` +
      `Return JSON keys: title (concise, human — NOT the full product name), type (=${brief.articleType}), ` +
      `markdown (full article, H2/H3, disclosure near top, comparison, FAQ, CTA), metaTitle (<=60 chars), ` +
      `metaDescription (<=155 chars), sections (array of the H2 headings used).`,
  }),
};
