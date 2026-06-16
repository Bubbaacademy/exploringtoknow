import type { CollectionConfig } from 'payload';
import { scopedRead, scopedCreate, scopedMutate, stampTenantWorkspace } from '@/lib/access';
export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: { useAsTitle: 'name', group: 'Catalog' },
  access: {
    read: scopedRead('public'),
    create: scopedCreate(),
    update: scopedMutate(),
    delete: scopedMutate(),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true, admin: { description: 'Owning tenant (ExploringToKnow for existing records; set by backfill).' } },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true, admin: { description: 'Owning workspace/publication (ETK Magazine for existing records; set by backfill).' } },
    { name: 'description', type: 'textarea' },
    { name: 'website', type: 'text' },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
