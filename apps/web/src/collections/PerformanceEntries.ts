import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Performance entries (Phase 28) — MANUAL measurement foundation. Every row is a
 * user-entered or pasted/CSV-imported performance record. NOTHING is synced from any
 * ad/social platform: no OAuth, no account connection, no external API. Computed
 * metrics (CTR/CPC/CPM/CVR/CPA/ROAS) are derived from these raw values at display time
 * and are clearly labelled as calculated from manually entered data. Tenant/workspace
 * are stamped server-side; native mutate is super-only (mirrors Ads/Social Studio).
 */
export const PerformanceEntries: CollectionConfig = {
  slug: 'performance-entries',
  labels: { singular: 'Performance Entry', plural: 'Performance Entries' },
  admin: { useAsTitle: 'campaignName', group: 'Platform', defaultColumns: ['campaignName', 'platform', 'channelType', 'entryDate', 'workspace'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    {
      name: 'sourceType', type: 'select', required: true, defaultValue: 'manual_entry', index: true,
      options: [
        { label: 'Manual entry', value: 'manual_entry' },
        { label: 'CSV paste', value: 'csv_paste' },
        { label: 'Internal landing-page views', value: 'internal_landing_page_views' },
        { label: 'Placeholder', value: 'placeholder' },
      ],
    },
    {
      name: 'platform', type: 'select', required: true, defaultValue: 'generic', index: true,
      options: [
        { label: 'Meta Ads', value: 'meta' }, { label: 'Google Search', value: 'google_search' },
        { label: 'Google Display', value: 'google_display' }, { label: 'YouTube', value: 'youtube' },
        { label: 'TikTok', value: 'tiktok' }, { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Pinterest', value: 'pinterest' }, { label: 'Instagram', value: 'instagram' },
        { label: 'Facebook', value: 'facebook' }, { label: 'X / Twitter', value: 'x_twitter' },
        { label: 'Generic', value: 'generic' }, { label: 'Unknown', value: 'unknown' },
      ],
    },
    {
      name: 'channelType', type: 'select', required: true, defaultValue: 'generic', index: true,
      options: [
        { label: 'Ad', value: 'ad' }, { label: 'Social', value: 'social' }, { label: 'Landing page', value: 'landing_page' },
        { label: 'Article', value: 'article' }, { label: 'Product', value: 'product' },
        { label: 'Email (placeholder)', value: 'email_placeholder' }, { label: 'Generic', value: 'generic' },
      ],
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'recorded', index: true,
      options: [
        { label: 'Draft', value: 'draft' }, { label: 'Recorded', value: 'recorded' }, { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'entryDate', type: 'text', index: true, admin: { description: 'Date or range start (YYYY-MM-DD). Manual.' } },
    { name: 'entryDateEnd', type: 'text', admin: { description: 'Optional range end (YYYY-MM-DD).' } },
    { name: 'campaignName', type: 'text' },
    { name: 'adSetName', type: 'text' },
    { name: 'creativeName', type: 'text' },
    // Raw, user-provided numbers. Stored verbatim — never invented or synced.
    { name: 'impressions', type: 'number', defaultValue: 0 },
    { name: 'clicks', type: 'number', defaultValue: 0 },
    { name: 'spend', type: 'number', defaultValue: 0 },
    { name: 'conversions', type: 'number', defaultValue: 0 },
    { name: 'orders', type: 'number', defaultValue: 0 },
    { name: 'revenue', type: 'number', defaultValue: 0 },
    { name: 'leads', type: 'number', defaultValue: 0 },
    { name: 'addToCart', type: 'number', defaultValue: 0 },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    { name: 'notes', type: 'textarea' },
    { name: 'importBatchId', type: 'text', index: true, admin: { description: 'Groups rows from one CSV paste import.' } },
    { name: 'relatedAdCampaign', type: 'relationship', relationTo: 'ad-campaigns', index: true },
    { name: 'relatedAdCreative', type: 'relationship', relationTo: 'ad-creatives', index: true },
    { name: 'relatedLandingPage', type: 'relationship', relationTo: 'landing-pages', index: true },
    { name: 'relatedSocialPost', type: 'relationship', relationTo: 'social-studio-posts', index: true },
    { name: 'relatedProduct', type: 'relationship', relationTo: 'products', index: true },
    { name: 'relatedRequest', type: 'relationship', relationTo: 'product-requests', index: true },
    { name: 'relatedArticle', type: 'relationship', relationTo: 'articles', index: true },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
