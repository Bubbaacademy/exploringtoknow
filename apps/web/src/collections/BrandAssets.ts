import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Workspace Asset Library foundation (Phase 22). Lightweight METADATA + reference
 * entries for brand/product assets (logo, brand images, product images, documents,
 * links) with a permission label. No binary upload pipeline is added here — entries
 * reference an external URL or note; the tenant-safe Media collection can be wired
 * for real uploads in a later phase. Tenant/workspace are stamped server-side.
 */
export const BrandAssets: CollectionConfig = {
  slug: 'brand-assets',
  labels: { singular: 'Brand Asset', plural: 'Brand Assets' },
  admin: { useAsTitle: 'label', group: 'Platform', defaultColumns: ['label', 'assetType', 'permission', 'workspace', 'createdAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'assetType', type: 'select', required: true, defaultValue: 'other', index: true,
      options: [
        { label: 'Logo', value: 'logo' },
        { label: 'Brand image', value: 'brand_image' },
        { label: 'Product image', value: 'product_image' },
        { label: 'Document', value: 'document' },
        { label: 'Link / reference', value: 'link' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'permission', type: 'select', required: true, defaultValue: 'needs_review', index: true,
      options: [
        { label: 'User-provided', value: 'user_provided' },
        { label: 'Permission-cleared', value: 'permission_cleared' },
        { label: 'Needs review', value: 'needs_review' },
        { label: 'Unknown', value: 'unknown' },
      ],
    },
    { name: 'sourceUrl', type: 'text', admin: { description: 'External URL or location reference (no file is uploaded here).' } },
    { name: 'notes', type: 'textarea' },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
