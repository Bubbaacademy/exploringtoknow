import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Workspace Landing Pages (Phase 23). Manually authored + manually published —
 * NEVER generated or published automatically. Tenant/workspace are stamped
 * server-side from the actor's membership (never client input). Writes go through
 * the workspace server routes (Local API, overrideAccess) with a canWrite role
 * check; the native REST surface is read-scoped to the actor's tenant and mutated
 * only by super admins. Public visibility is gated SOLELY by status='published'
 * (rendered at /lp/[workspaceSlug]/[slug] via the Local API with explicit scope).
 */
export const LandingPages: CollectionConfig = {
  slug: 'landing-pages',
  labels: { singular: 'Landing Page', plural: 'Landing Pages' },
  admin: { useAsTitle: 'title', group: 'Platform', defaultColumns: ['title', 'slug', 'status', 'pageType', 'workspace', 'updatedAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', index: true, admin: { description: 'URL slug — unique within the workspace.' } },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for review', value: 'ready_for_review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'pageType', type: 'select', required: true, defaultValue: 'general', index: true,
      options: [
        { label: 'Affiliate bridge', value: 'affiliate_bridge' },
        { label: 'Product promo', value: 'product_promo' },
        { label: 'Lead capture (placeholder)', value: 'lead_capture_placeholder' },
        { label: 'General', value: 'general' },
      ],
    },
    { name: 'headline', type: 'text' },
    { name: 'subheadline', type: 'text' },
    { name: 'body', type: 'textarea', admin: { description: 'Legacy/simple body — paragraphs separated by a blank line. Rendered when no structured sections exist.' } },
    { name: 'sections', type: 'json', admin: { description: 'Structured sections (Phase 24): array of {type, heading, text, items, pros, cons, ctaLabel, ctaUrl}. Manual authoring only — validated/whitelisted server-side.' } },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text', admin: { description: 'http(s) only. Unsafe protocols are rejected server-side.' } },
    { name: 'disclosureText', type: 'textarea', admin: { description: 'Affiliate / disclosure note shown on the published page when set.' } },
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
    { name: 'noindex', type: 'checkbox', defaultValue: true, admin: { description: 'Keep search engines out. Forced on for any non-published page.' } },
    { name: 'publishedAt', type: 'date', admin: { readOnly: true } },
    { name: 'relatedProduct', type: 'relationship', relationTo: 'products', index: true },
    { name: 'relatedRequest', type: 'relationship', relationTo: 'product-requests', index: true },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
