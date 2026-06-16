import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';
/** Generated buyer intelligence per product (impl pkg §4). Read-mostly downstream. */
export const ProductIntelligence: CollectionConfig = {
  slug: 'product-intelligence',
  admin: { useAsTitle: 'id', group: 'AI Pipeline' },
  access: {
    read: scopedRead('deny'),
    create: scopedCreate(), // worker writes via the Local API (overrideAccess)
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
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
  hooks: { beforeChange: [stampTenantWorkspace] },
};
