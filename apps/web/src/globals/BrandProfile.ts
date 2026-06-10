import type { GlobalConfig } from 'payload';
/**
 * Centralized Brand Profile (single global — internal, no multi-tenancy).
 * Injected into every generation prompt via @etk/prompts brandPreamble. Mirrors
 * the BrandProfile type in @etk/core.
 */
export const BrandProfileGlobal: GlobalConfig = {
  slug: 'brand-profile',
  admin: { group: 'AI Pipeline' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true, defaultValue: 'ExploringToKnow' },
    { name: 'tone', type: 'textarea', required: true, defaultValue: 'warm, authoritative, plainspoken — never hypey' },
    { name: 'style', type: 'textarea', required: true, defaultValue: 'trustworthy editorial review site (Wirecutter / LoveToKnow / The Spruce)' },
    { name: 'readingLevel', type: 'text', required: true, defaultValue: 'US grade 7-8' },
    { name: 'ctaStyle', type: 'textarea', required: true, defaultValue: 'one clear primary CTA above the fold and one in the conclusion; no pressure' },
    { name: 'disclosureStyle', type: 'textarea', required: true, defaultValue: 'plain FTC affiliate disclosure near the top of the article' },
    {
      name: 'forbiddenTerms', type: 'array', labels: { singular: 'Term', plural: 'Forbidden Terms' },
      fields: [{ name: 'term', type: 'text', required: true }],
      defaultValue: [{ term: 'miracle' }, { term: 'guaranteed' }, { term: 'cure' }, { term: 'risk-free' }],
    },
  ],
};
