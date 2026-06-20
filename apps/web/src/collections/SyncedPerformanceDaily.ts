import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Synced daily performance (Phase 31) — normalized read-only metrics pulled from a
 * provider API (Google Ads first). One row per (account × campaign [× ad group × ad]
 * × day). Source is ALWAYS `api_synced` and labeled by provider — kept SEPARATE from
 * Phase 28 manual `performance-entries` and Phase 24 internal landing-page views.
 * Raw API metrics are stored verbatim (impressions/clicks/cost_micros/conversions/
 * conversion_value); calculated metrics (CTR/CPC/CPM/CVR/CPA/ROAS) are derived at
 * display time. NO mutate/write to the provider ever produces these rows.
 */
export const SyncedPerformanceDaily: CollectionConfig = {
  slug: 'synced-performance-daily',
  labels: { singular: 'Synced Performance (daily)', plural: 'Synced Performance (daily)' },
  admin: { useAsTitle: 'campaignName', group: 'Platform', defaultColumns: ['provider', 'metricDate', 'campaignName', 'impressions', 'clicks', 'workspace'] },
  access: { read: scopedRead('deny'), create: superOnly, update: superOnly, delete: superOnly },
  fields: [
    {
      name: 'provider', type: 'select', required: true, defaultValue: 'google_ads', index: true,
      options: ['google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'pinterest_ads', 'microsoft_ads', 'amazon_ads', 'x_ads', 'snapchat_ads', 'generic'].map((v) => ({ label: v, value: v })),
    },
    { name: 'providerConnection', type: 'relationship', relationTo: 'provider-connections', index: true },
    { name: 'providerAccount', type: 'relationship', relationTo: 'provider-accounts', index: true },
    { name: 'customerId', type: 'text', index: true },
    { name: 'metricDate', type: 'text', required: true, index: true, admin: { description: 'UTC day (YYYY-MM-DD) of the metrics.' } },
    { name: 'campaignId', type: 'text', index: true },
    { name: 'campaignName', type: 'text' },
    { name: 'campaignStatus', type: 'text' },
    { name: 'campaignChannelType', type: 'text' },
    { name: 'adGroupId', type: 'text' },
    { name: 'adGroupName', type: 'text' },
    { name: 'adId', type: 'text' },
    { name: 'adName', type: 'text' },
    { name: 'adType', type: 'text' },
    { name: 'finalUrl', type: 'text' },
    // Raw, provider-reported metrics — stored verbatim, never invented.
    { name: 'impressions', type: 'number', defaultValue: 0 },
    { name: 'clicks', type: 'number', defaultValue: 0 },
    { name: 'costMicros', type: 'number', defaultValue: 0, admin: { description: 'Google-reported cost in micros (1,000,000 = 1 currency unit).' } },
    { name: 'cost', type: 'number', defaultValue: 0, admin: { description: 'cost_micros / 1e6, for display only.' } },
    { name: 'conversions', type: 'number', defaultValue: 0 },
    { name: 'conversionValue', type: 'number', defaultValue: 0, admin: { description: 'Google-reported conversion value (revenue) — only as provided.' } },
    { name: 'currencyCode', type: 'text' },
    {
      name: 'source', type: 'select', required: true, defaultValue: 'api_synced', index: true,
      options: [{ label: 'API synced', value: 'api_synced' }],
    },
    { name: 'syncedAt', type: 'date', admin: { readOnly: true } },
    { name: 'syncRun', type: 'relationship', relationTo: 'provider-sync-runs', index: true },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
