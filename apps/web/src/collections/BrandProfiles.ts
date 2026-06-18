import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Workspace Brand Kit / Brand Profile (Phase 22). ONE per workspace — the brand
 * identity foundation that future outputs (magazine, social, landing pages, ads)
 * will draw on. Tenant/workspace are stamped server-side from the actor's
 * membership (never client input). Writes go through the workspace server routes
 * (Local API, overrideAccess) with an owner/admin role check; the native REST
 * surface is read-scoped to the actor's tenant and mutated only by super admins.
 */
export const BrandProfiles: CollectionConfig = {
  slug: 'brand-profiles',
  labels: { singular: 'Brand Profile', plural: 'Brand Profiles' },
  admin: { useAsTitle: 'brandName', group: 'Platform', defaultColumns: ['brandName', 'publicationName', 'workspace', 'updatedAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'brandName', type: 'text' },
    { name: 'publicationName', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'targetAudience', type: 'textarea' },
    { name: 'brandVoice', type: 'textarea' },
    { name: 'editorialStyle', type: 'textarea' },
    { name: 'primaryColor', type: 'text', admin: { description: 'Hex like #14543f.' } },
    { name: 'accentColor', type: 'text', admin: { description: 'Hex like #c9a227.' } },
    { name: 'websiteUrl', type: 'text' },
    { name: 'socialLinks', type: 'textarea', admin: { description: 'One profile URL per line (placeholders welcome).' } },
    { name: 'affiliateDisclosure', type: 'textarea', admin: { description: 'Disclosure preference / notes if affiliate links are used.' } },
    { name: 'focusNotes', type: 'textarea', admin: { description: 'Product / category focus notes.' } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
