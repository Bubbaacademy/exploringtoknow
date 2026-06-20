import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Provider accounts (Phase 31) — ad accounts discovered under a provider connection
 * (e.g. Google Ads accessible customers). READ-ONLY identity metadata only; no tokens
 * here. Tenant/workspace-scoped; native mutate super-only. Supports multiple accounts
 * per connection (MCC), with a `selected` flag for the account v1 sync targets.
 */
export const ProviderAccounts: CollectionConfig = {
  slug: 'provider-accounts',
  labels: { singular: 'Provider Account', plural: 'Provider Accounts' },
  admin: { useAsTitle: 'providerAccountName', group: 'Platform', defaultColumns: ['provider', 'providerAccountId', 'providerAccountName', 'selected', 'workspace'] },
  access: { read: scopedRead('deny'), create: superOnly, update: superOnly, delete: superOnly },
  fields: [
    {
      name: 'provider', type: 'select', required: true, defaultValue: 'google_ads', index: true,
      options: ['google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'pinterest_ads', 'microsoft_ads', 'amazon_ads', 'x_ads', 'snapchat_ads', 'generic'].map((v) => ({ label: v, value: v })),
    },
    { name: 'providerConnection', type: 'relationship', relationTo: 'provider-connections', index: true },
    { name: 'providerAccountId', type: 'text', index: true, admin: { description: 'Provider account / Google Ads customer id (digits only).' } },
    { name: 'providerAccountName', type: 'text' },
    { name: 'managerCustomerId', type: 'text', admin: { description: 'MCC / manager customer id, if accessed via a manager.' } },
    { name: 'currencyCode', type: 'text' },
    { name: 'timeZone', type: 'text' },
    {
      name: 'status', type: 'select', defaultValue: 'active', index: true,
      options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Unknown', value: 'unknown' }],
    },
    { name: 'selected', type: 'checkbox', defaultValue: false, admin: { description: 'The account this connection syncs in v1.' } },
    { name: 'lastFetchedAt', type: 'date', admin: { readOnly: true } },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
