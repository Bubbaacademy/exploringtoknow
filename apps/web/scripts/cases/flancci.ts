import type { ProductInput } from '@etk/core';

/**
 * Phase C test case — FLANCCI LED Light Dimming Stickers (ASIN B09DY1ZHKS).
 * `notes` carries REAL product facts + use cases so Product Intelligence is
 * grounded in the actual product (not invented).
 */
export const FLANCCI_CASE = {
  brand: { name: 'FLANCCI', slug: 'flancci' },
  product: {
    id: 'pending',
    title:
      'FLANCCI LED Light Dimming Stickers, Adhesive Light Filters for Reducing Bright LED Lights, ' +
      'Sleep-Friendly Light Softening Sheets (2 Sheets)',
    slug: 'flancci-led-light-dimming-stickers',
    offerType: 'amazon_affiliate' as ProductInput['offerType'],
    brand: 'FLANCCI',
    categories: ['sleep', 'home', 'electronics-accessories'],
    notes: [
      'Product: adhesive dimming stickers / light-filtering sheets that reduce the brightness of',
      'bright LED indicator and standby lights on household electronics.',
      'ASIN B09DY1ZHKS. Pack of 2 sheets; cut-to-size to fit any light; multiple dimming levels by',
      'layering or choosing different opacity areas. Removable and repositionable; leaves no residue.',
      'Use cases: routers/modems, TVs and soundbars, smoke/CO detectors, air purifiers, power strips,',
      'chargers, alarm clocks, computer towers, baby monitors. Blocks/softens harsh blue/white/green',
      'standby LEDs that disrupt sleep in bedrooms and nurseries.',
      'Benefits: darker sleep environment, less light pollution, no need to unplug devices or use tape,',
      'reusable, discreet. Pain points it solves: LED glare keeping people awake, taping over lights',
      'looking ugly, electrical tape blocking light fully when you still want some visibility.',
      'Audience: light-sensitive sleepers, parents, shift workers, people in studio apartments/dorms.',
    ].join(' '),
  },
} as const;
