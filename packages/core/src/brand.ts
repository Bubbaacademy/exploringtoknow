import type { BrandProfile } from './types';

/** Fallback brand used when the Payload global is unset (keeps pipeline runnable). */
export const DEFAULT_BRAND: BrandProfile = {
  name: 'ExploringToKnow',
  tone: 'warm, authoritative, plainspoken — never hypey',
  style: 'trustworthy editorial review site (Wirecutter / LoveToKnow / The Spruce)',
  readingLevel: 'US grade 7-8',
  ctaStyle: 'one clear primary CTA above the fold and one in the conclusion; no pressure',
  disclosureStyle: 'plain FTC affiliate disclosure near the top of the article',
  forbiddenTerms: ['miracle', 'guaranteed', 'cure', 'best ever', '100%', 'risk-free'],
};
