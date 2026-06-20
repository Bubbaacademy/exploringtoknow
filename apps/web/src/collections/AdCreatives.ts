import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Ads Studio — ad creative drafts (Phase 27). MANUAL authoring only. Each creative
 * belongs to an ad campaign in the SAME workspace (verified server-side). No asset
 * upload (references/placeholders only), no AI generation, no platform/ad API, no
 * publishing. Tenant/workspace stamped server-side; native mutate is super-only.
 */
export const AdCreatives: CollectionConfig = {
  slug: 'ad-creatives',
  labels: { singular: 'Ad Creative', plural: 'Ad Creatives' },
  admin: { useAsTitle: 'name', group: 'Platform', defaultColumns: ['name', 'campaign', 'platform', 'format', 'status', 'workspace'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    { name: 'campaign', type: 'relationship', relationTo: 'ad-campaigns', index: true, admin: { description: 'Parent campaign (same workspace).' } },
    { name: 'name', type: 'text', required: true },
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
      name: 'platform', type: 'select', defaultValue: 'generic', index: true,
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
      name: 'format', type: 'select', defaultValue: 'text_ad', index: true,
      options: [
        { label: 'Text ad', value: 'text_ad' },
        { label: 'Search ad', value: 'search_ad' },
        { label: 'Image ad (placeholder)', value: 'image_ad_placeholder' },
        { label: 'Carousel (placeholder)', value: 'carousel_placeholder' },
        { label: 'Short video (placeholder)', value: 'short_video_placeholder' },
        { label: 'Display ad (placeholder)', value: 'display_ad_placeholder' },
        { label: 'Generic', value: 'generic' },
      ],
    },
    { name: 'headline', type: 'textarea', admin: { description: 'One headline per line for variants.' } },
    { name: 'primaryText', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text', admin: { description: 'http(s) only. Unsafe protocols are rejected server-side.' } },
    { name: 'displayPath', type: 'text', admin: { description: 'Display URL path (e.g. example.com/deals) — cosmetic, not a real link.' } },
    { name: 'keywords', type: 'textarea', admin: { description: 'Keyword / hashtag notes (manual).' } },
    { name: 'creativeNotes', type: 'textarea' },
    { name: 'disclosureText', type: 'textarea' },
    { name: 'relatedSocialPost', type: 'relationship', relationTo: 'social-studio-posts', index: true },
    { name: 'relatedLandingPage', type: 'relationship', relationTo: 'landing-pages', index: true },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'updatedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
