import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Ads Studio — ad campaign drafts (Phase 27). MANUAL PLANNING ONLY. Nothing here
 * connects an ad account, calls a platform/ad API, launches a campaign, or spends a
 * budget — budget/schedule fields are planning NOTES. Tenant/workspace are stamped
 * server-side from the actor's membership (never client input). Writes go through the
 * workspace server routes (Local API, overrideAccess) with a canWrite role check; the
 * native REST surface is read-scoped to the actor's tenant and mutated only by super
 * admins (mirrors Landing Pages / Social Studio).
 */
export const AdCampaigns: CollectionConfig = {
  slug: 'ad-campaigns',
  labels: { singular: 'Ad Campaign', plural: 'Ad Campaigns' },
  admin: { useAsTitle: 'name', group: 'Platform', defaultColumns: ['name', 'platform', 'objective', 'status', 'workspace', 'updatedAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'Internal campaign name (not launched anywhere).' } },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'draft', index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for review', value: 'ready_for_review' },
        { label: 'Approved to export', value: 'approved_to_export' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'platform', type: 'select', required: true, defaultValue: 'generic', index: true,
      options: [
        { label: 'Meta Ads', value: 'meta' },
        { label: 'Google Search', value: 'google_search' },
        { label: 'Google Display', value: 'google_display' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Pinterest', value: 'pinterest' },
        { label: 'Generic', value: 'generic' },
      ],
    },
    {
      name: 'objective', type: 'select', required: true, defaultValue: 'generic', index: true,
      options: [
        { label: 'Awareness', value: 'awareness' },
        { label: 'Traffic', value: 'traffic' },
        { label: 'Leads', value: 'leads' },
        { label: 'Sales', value: 'sales' },
        { label: 'Engagement', value: 'engagement' },
        { label: 'Retargeting (placeholder)', value: 'retargeting_placeholder' },
        { label: 'Generic', value: 'generic' },
      ],
    },
    { name: 'audienceName', type: 'text' },
    { name: 'audienceNotes', type: 'textarea' },
    { name: 'geographyNotes', type: 'textarea' },
    { name: 'languageNotes', type: 'text' },
    { name: 'placementNotes', type: 'textarea' },
    { name: 'budgetNotes', type: 'textarea', admin: { description: 'Planning notes only — NOT real spend. No budget is ever charged.' } },
    { name: 'scheduleNotes', type: 'textarea', admin: { description: 'Planning notes only — nothing is scheduled to run.' } },
    { name: 'primaryCTA', type: 'text' },
    { name: 'destinationURL', type: 'text', admin: { description: 'http(s) only. Unsafe protocols are rejected server-side.' } },
    { name: 'utmSource', type: 'text' },
    { name: 'utmMedium', type: 'text' },
    { name: 'utmCampaign', type: 'text' },
    { name: 'utmContent', type: 'text' },
    { name: 'utmTerm', type: 'text' },
    { name: 'disclosureText', type: 'textarea', admin: { description: 'Compliance / disclosure notes.' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes.' } },
    { name: 'relatedProduct', type: 'relationship', relationTo: 'products', index: true },
    { name: 'relatedRequest', type: 'relationship', relationTo: 'product-requests', index: true },
    { name: 'relatedLandingPage', type: 'relationship', relationTo: 'landing-pages', index: true },
    { name: 'relatedSocialPost', type: 'relationship', relationTo: 'social-studio-posts', index: true },
    { name: 'relatedBrandProfile', type: 'relationship', relationTo: 'brand-profiles', index: true },
    { name: 'exportedAt', type: 'date', admin: { readOnly: true, description: 'Last manual copy/export (first-party — no external call).' } },
    { name: 'exportCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
