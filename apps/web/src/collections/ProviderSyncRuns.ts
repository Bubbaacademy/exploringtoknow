import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Provider sync runs (Phase 30) — audit/foundation log for future provider syncs. In
 * this phase NO real provider sync occurs; this table exists so later phases (Google
 * Ads read sync = Phase 31) record each run with status, counts, and errors. Tenant/
 * workspace-scoped; native mutate super-only.
 */
export const ProviderSyncRuns: CollectionConfig = {
  slug: 'provider-sync-runs',
  labels: { singular: 'Provider Sync Run', plural: 'Provider Sync Runs' },
  admin: { useAsTitle: 'id', group: 'Platform', defaultColumns: ['provider', 'syncType', 'status', 'workspace', 'createdAt'] },
  access: {
    read: scopedRead('deny'),
    create: superOnly,
    update: superOnly,
    delete: superOnly,
  },
  fields: [
    {
      name: 'provider', type: 'select', required: true, index: true,
      options: ['google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'pinterest_ads', 'microsoft_ads', 'amazon_ads', 'x_ads', 'snapchat_ads', 'generic'].map((v) => ({ label: v, value: v })),
    },
    { name: 'connection', type: 'relationship', relationTo: 'provider-connections', index: true },
    {
      name: 'syncType', type: 'select', required: true, defaultValue: 'account_identity_placeholder',
      options: ['account_identity_placeholder', 'performance_read', 'campaign_read', 'creative_read', 'manual_test_placeholder'].map((v) => ({ label: v, value: v })),
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'queued', index: true,
      options: ['queued', 'running', 'succeeded', 'failed', 'skipped'].map((v) => ({ label: v, value: v })),
    },
    { name: 'startedAt', type: 'date', admin: { readOnly: true } },
    { name: 'finishedAt', type: 'date', admin: { readOnly: true } },
    { name: 'windowStart', type: 'text', admin: { description: 'Sync date-range start (YYYY-MM-DD).' } },
    { name: 'windowEnd', type: 'text', admin: { description: 'Sync date-range end (YYYY-MM-DD).' } },
    { name: 'recordsRead', type: 'number', defaultValue: 0 },
    { name: 'recordsWritten', type: 'number', defaultValue: 0 },
    { name: 'errorCode', type: 'text', admin: { readOnly: true } },
    { name: 'errorMessage', type: 'text', admin: { readOnly: true } },
    {
      name: 'source', type: 'select', required: true, defaultValue: 'system',
      options: [
        { label: 'Provider API', value: 'provider_api' },
        { label: 'Manual', value: 'manual' },
        { label: 'System', value: 'system' },
      ],
    },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
