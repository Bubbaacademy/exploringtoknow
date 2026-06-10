import type { CollectionConfig } from 'payload';
/** Generated buyer intelligence per product (impl pkg §4). Read-mostly downstream. */
export const ProductIntelligence: CollectionConfig = {
  slug: 'product-intelligence',
  admin: { useAsTitle: 'id', group: 'AI Pipeline' },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'personas', type: 'json' },
    { name: 'painPoints', type: 'json' },
    { name: 'benefits', type: 'json' },
    { name: 'features', type: 'json' },
    { name: 'useCases', type: 'json' },
    { name: 'competitorThemes', type: 'json' },
    { name: 'searchIntent', type: 'text' },
    { name: 'ctaRecommendations', type: 'json' },
    { name: 'model', type: 'text', admin: { description: 'Model + prompt version used.' } },
    { name: 'generatedAt', type: 'date' },
  ],
};
