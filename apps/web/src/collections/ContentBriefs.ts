import type { CollectionConfig } from 'payload';
/** The brief that drives exactly one article (impl pkg §4). */
export const ContentBriefs: CollectionConfig = {
  slug: 'content-briefs',
  admin: { useAsTitle: 'chosenTitle', group: 'AI Pipeline' },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'intelligence', type: 'relationship', relationTo: 'product-intelligence' },
    { name: 'titleOptions', type: 'json' },
    { name: 'chosenTitle', type: 'text' },
    { name: 'angle', type: 'text' },
    { name: 'primaryKeyword', type: 'text' },
    { name: 'secondaryKeywords', type: 'json' },
    { name: 'searchIntent', type: 'text' },
    { name: 'internalLinkPlan', type: 'json' },
    { name: 'ctaStrategy', type: 'textarea' },
    { name: 'affiliatePlacement', type: 'textarea' },
    {
      name: 'status', type: 'select', defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready', value: 'ready' },
        { label: 'Used', value: 'used' },
      ],
    },
  ],
};
