import type { CollectionConfig } from 'payload';
import { scopedRead, superOnly, stampTenantWorkspace } from '@/lib/access';

/**
 * Provider connections (Phase 30) — the tenant/workspace-scoped OAuth/token vault for
 * ad/social providers (Google Ads, Meta, TikTok, LinkedIn, Pinterest, …). FOUNDATION
 * ONLY: no provider data is synced and no campaigns launch in this phase. Tokens are
 * stored ENCRYPTED (AES-256-GCM via lib/provider-crypto) and are NEVER returned to
 * clients, shown in UI, or logged; the workspace data layer strips them. Native mutate
 * is super-only; writes go through owner/admin-gated server routes. If the vault key
 * (PROVIDER_TOKEN_ENCRYPTION_KEY) or provider client env is missing, connections stay
 * local-safe ("not configured") and no token is ever stored.
 */
export const ProviderConnections: CollectionConfig = {
  slug: 'provider-connections',
  labels: { singular: 'Provider Connection', plural: 'Provider Connections' },
  admin: { useAsTitle: 'displayName', group: 'Platform', defaultColumns: ['provider', 'status', 'displayName', 'workspace', 'updatedAt'] },
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
    {
      name: 'connectionType', type: 'select', required: true, defaultValue: 'oauth',
      options: [
        { label: 'OAuth', value: 'oauth' },
        { label: 'API key (placeholder)', value: 'api_key_placeholder' },
        { label: 'Manual (placeholder)', value: 'manual_placeholder' },
      ],
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'not_configured', index: true,
      options: ['not_configured', 'ready_to_connect', 'connected', 'expired', 'disconnected', 'error', 'disabled'].map((v) => ({ label: v, value: v })),
    },
    { name: 'displayName', type: 'text' },
    { name: 'providerAccountId', type: 'text' },
    { name: 'providerAccountName', type: 'text' },
    { name: 'managerAccountId', type: 'text' },
    { name: 'currencyCode', type: 'text' },
    { name: 'timeZone', type: 'text' },
    { name: 'scopes', type: 'json' },
    { name: 'tokenType', type: 'text' },
    // Encrypted token blobs — server-only, never exposed to the workspace API/UI.
    { name: 'accessTokenEncrypted', type: 'text', admin: { readOnly: true, description: 'AES-256-GCM ciphertext. Never returned to clients or logged.' } },
    { name: 'refreshTokenEncrypted', type: 'text', admin: { readOnly: true, description: 'AES-256-GCM ciphertext. Never returned to clients or logged.' } },
    { name: 'tokenExpiresAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastConnectedAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastRefreshedAt', type: 'date', admin: { readOnly: true } },
    { name: 'lastSyncAt', type: 'date', admin: { readOnly: true, description: 'Placeholder — no sync occurs in Phase 30.' } },
    { name: 'lastErrorCode', type: 'text', admin: { readOnly: true } },
    { name: 'lastErrorMessage', type: 'text', admin: { readOnly: true } },
    { name: 'connectedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'disconnectedAt', type: 'date', admin: { readOnly: true } },
    { name: 'disconnectedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
    { name: 'notes', type: 'textarea' },
    { name: 'tenant', type: 'relationship', relationTo: 'tenants', index: true },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', index: true },
  ],
  hooks: { beforeChange: [stampTenantWorkspace] },
};
