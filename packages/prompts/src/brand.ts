import type { BrandProfile } from '@etk/core';

/**
 * Renders the brand profile into a system-prompt preamble. Prepended to EVERY
 * generation prompt so tone/style/reading level/CTA/disclosure/forbidden terms
 * are injected consistently (single source of brand voice).
 */
export function brandPreamble(brand: BrandProfile): string {
  return [
    `BRAND VOICE — follow strictly for "${brand.name}":`,
    `- Tone: ${brand.tone}`,
    `- Style: ${brand.style}`,
    `- Reading level: ${brand.readingLevel}`,
    `- CTA style: ${brand.ctaStyle}`,
    `- Disclosure: ${brand.disclosureStyle}`,
    `- Never use these terms: ${brand.forbiddenTerms.join(', ') || '(none)'}`,
  ].join('\n');
}
