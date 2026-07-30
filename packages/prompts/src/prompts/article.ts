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
      '- Do NOT write an affiliate disclosure, an affiliate link, or a buy CTA anywhere in the body. The site renders ' +
      'the disclosure automatically for product-linked articles, so writing one duplicates it. Explain who the product ' +
      'is and is not for instead.\n' +
      '- NEVER emit a placeholder or invented link — no "](#)", no made-up URLs, no fabricated anchors. Link only to ' +
      'something you were explicitly given. If you have no URL, write plain text.\n' +
      '- No unsupported comparative or future-value claims. Do NOT write "long-term", "long-term flexibility", ' +
      '"room to grow", "future-proof", "upgrade path", "better over time", "grows with you", or similar unverified ' +
      'benefit language unless you are directly quoting the manufacturer. Describe what something IS and what it ' +
      'REQUIRES, not what it will be worth later. Right register: "XLR requires an audio interface and can fit ' +
      'setups that use mixers or multiple microphones. USB is simpler to connect directly."\n' +
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
      (brief.articleType === 'review'
        // A review is a different shape from a problem/solution piece. This is the
        // structure that produced the magazine's first publishable automated review
        // (article 18) — including the explicit basis statement the publish gate
        // requires, since we never test anything hands-on.
        ? `\nThis is a PRODUCT REVIEW. Use these H2 sections, in this order:\n` +
          `1. What this product is\n` +
          `2. What is in the pack — only if you were given it above; otherwise tell the reader what to check on the current listing, and state NO numbers of your own\n` +
          `3. How it is meant to be used\n` +
          `4. Where it works well\n` +
          `5. Where it is not the right fit\n` +
          `6. Trade-offs and limitations\n` +
          `7. Who should consider something else\n` +
          `8. How we reviewed this — state plainly that this is a RESEARCH-BASED review drawn from the ` +
          `manufacturer's published product information, that nothing was hands-on tested, measured or ` +
          `lab-tested, and name what could not be verified.\n` +
          `Do NOT invent specifications, pack contents, materials, dimensions, percentages or durability ` +
          `figures. Aim ~1,000–1,400 words; thorough, not padded.\n`
        : `\nMUST: address the specific real-world problems surfaced above; include a practical, honest ` +
          `COMPARISON of this product approach vs the common alternatives a reader would actually consider — ` +
          `strengths AND weaknesses of each; include a short FAQ; end with an honest ` +
          `recommendation (who it’s for / not for). Aim ~1,000–1,400 words; thorough, not padded.\n`) +
      `Return JSON keys: title (concise, human — NOT the full product name), type (=${brief.articleType}), ` +
      `markdown (full article, H2/H3 — no disclosure, no affiliate link, no buy CTA, no placeholder links), metaTitle (<=60 chars), ` +
      `metaDescription (<=155 chars), sections (array of the H2 headings used).`,
  }),
};
