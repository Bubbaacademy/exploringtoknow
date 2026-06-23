/**
 * Provider registry (Phase 30) — pure, client-safe config for every ad/social
 * provider. Lists required ENV VAR NAMES only (never values), OAuth scopes, planned
 * capabilities, and the roadmap phase. The server-side setup-status evaluator
 * (lib/providers.ts) reads env PRESENCE against `requiredEnv`. No secrets here.
 *
 * Phase 30 is FOUNDATION ONLY — no provider data is synced and no campaigns launch.
 * Google Ads is the first planned read-sync provider (Phase 31, per PROVIDER_API_AUDIT.md).
 */
export const PROVIDER_IDS = [
  'google_ads', 'meta_ads', 'tiktok_ads', 'linkedin_ads', 'pinterest_ads',
  'microsoft_ads', 'amazon_ads', 'x_ads', 'snapchat_ads', 'generic',
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderCapabilities = { readMetrics: boolean; createCampaigns: boolean; socialPublish: boolean; conversionTracking: boolean };

export type ProviderDef = {
  id: ProviderId;
  displayName: string;
  type: 'ads' | 'social' | 'analytics';
  priority: number;             // 1 = first
  oauthSupported: boolean;
  readSyncPlanned: boolean;
  writePublishPlanned: boolean;
  comingSoon: boolean;          // true → not wired for connect yet (UI shows "Coming soon")
  requiredEnv: string[];        // env var NAMES only
  optionalEnv: string[];
  scopes: string[];
  capabilities: ProviderCapabilities;
  plannedPhase: string;
  notes: string;
};

const TOKEN_KEY = 'PROVIDER_TOKEN_ENCRYPTION_KEY';

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'google_ads', displayName: 'Google Ads', type: 'ads', priority: 1,
    oauthSupported: true, readSyncPlanned: true, writePublishPlanned: true, comingSoon: false,
    requiredEnv: ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: ['GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
    scopes: ['https://www.googleapis.com/auth/adwords'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: false, conversionTracking: true },
    plannedPhase: 'Phase 31 (read sync — first)', notes: 'Recommended first read-sync provider; covers YouTube/video via Google Ads API.',
  },
  {
    id: 'meta_ads', displayName: 'Meta Ads (Facebook/Instagram)', type: 'ads', priority: 2,
    oauthSupported: true, readSyncPlanned: true, writePublishPlanned: true, comingSoon: false,
    requiredEnv: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: ['META_API_VERSION'],
    scopes: ['ads_read'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: true, conversionTracking: true },
    plannedPhase: 'Phase 32 (read sync)', notes: 'Read-only ads_read (Ads Insights). Real ad accounts require Meta App Review (Advanced Access) + Business Verification; test users work before review.',
  },
  {
    id: 'tiktok_ads', displayName: 'TikTok Ads', type: 'ads', priority: 3,
    oauthSupported: true, readSyncPlanned: true, writePublishPlanned: true, comingSoon: false,
    requiredEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['ads.read'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: true, conversionTracking: true },
    plannedPhase: 'Later (after Google + Meta)', notes: 'Confirm exact scopes/sandbox before build (PROVIDER_API_AUDIT.md).',
  },
  {
    id: 'linkedin_ads', displayName: 'LinkedIn Ads', type: 'ads', priority: 4,
    oauthSupported: true, readSyncPlanned: true, writePublishPlanned: true, comingSoon: false,
    requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['r_ads', 'r_ads_reporting', 'rw_ads'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: false, conversionTracking: true },
    plannedPhase: 'Later', notes: 'Gated MDP approval; 3-legged member consent only; no full sandbox.',
  },
  {
    id: 'pinterest_ads', displayName: 'Pinterest Ads', type: 'ads', priority: 5,
    oauthSupported: true, readSyncPlanned: true, writePublishPlanned: true, comingSoon: false,
    requiredEnv: ['PINTEREST_CLIENT_ID', 'PINTEREST_CLIENT_SECRET', 'PINTEREST_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['ads:read'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: false, conversionTracking: true },
    plannedPhase: 'Later', notes: 'Trial→Standard access tiers; real sandbox; confirm exact scopes.',
  },
  {
    id: 'microsoft_ads', displayName: 'Microsoft Ads (Bing)', type: 'ads', priority: 6,
    oauthSupported: true, readSyncPlanned: false, writePublishPlanned: false, comingSoon: true,
    requiredEnv: ['MICROSOFT_ADS_CLIENT_ID', 'MICROSOFT_ADS_CLIENT_SECRET', 'MICROSOFT_ADS_DEVELOPER_TOKEN', 'MICROSOFT_ADS_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['https://ads.microsoft.com/msads.manage'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: false, conversionTracking: true },
    plannedPhase: 'Future', notes: 'Lowest-friction dev (universal sandbox token) but lower priority.',
  },
  {
    id: 'amazon_ads', displayName: 'Amazon Ads', type: 'ads', priority: 7,
    oauthSupported: true, readSyncPlanned: false, writePublishPlanned: false, comingSoon: true,
    requiredEnv: ['AMAZON_ADS_CLIENT_ID', 'AMAZON_ADS_CLIENT_SECRET', 'AMAZON_ADS_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['advertising::campaign_management'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: false, conversionTracking: true },
    plannedPhase: 'Future', notes: 'Relevant for retail/Amazon-seller workspaces.',
  },
  {
    id: 'x_ads', displayName: 'X / Twitter Ads', type: 'ads', priority: 8,
    oauthSupported: true, readSyncPlanned: false, writePublishPlanned: false, comingSoon: true,
    requiredEnv: ['X_ADS_CLIENT_ID', 'X_ADS_CLIENT_SECRET', 'X_ADS_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: [],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: true, conversionTracking: false },
    plannedPhase: 'Future', notes: 'Behind paid X API tiers; low priority.',
  },
  {
    id: 'snapchat_ads', displayName: 'Snapchat Ads', type: 'ads', priority: 9,
    oauthSupported: true, readSyncPlanned: false, writePublishPlanned: false, comingSoon: true,
    requiredEnv: ['SNAPCHAT_CLIENT_ID', 'SNAPCHAT_CLIENT_SECRET', 'SNAPCHAT_REDIRECT_URI', TOKEN_KEY],
    optionalEnv: [],
    scopes: ['snapchat-marketing-api'],
    capabilities: { readMetrics: true, createCampaigns: true, socialPublish: true, conversionTracking: true },
    plannedPhase: 'Future', notes: 'Open API but niche audience for this product.',
  },
];

export const PROVIDER_BY_ID: Record<string, ProviderDef> = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));
export const isProviderId = (v: unknown): v is ProviderId => typeof v === 'string' && v in PROVIDER_BY_ID;

export const CONNECTION_TYPES = ['oauth', 'api_key_placeholder', 'manual_placeholder'] as const;
export const CONNECTION_STATUSES = ['not_configured', 'ready_to_connect', 'connected', 'expired', 'disconnected', 'error', 'disabled'] as const;
export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  not_configured: 'Not configured', ready_to_connect: 'Ready to connect', connected: 'Connected',
  expired: 'Expired', disconnected: 'Disconnected', error: 'Error', disabled: 'Disabled',
};
/**
 * Status pill color (maps to .adm-badge.{ok|warn|err}; '' = neutral gray):
 * connected → green; disconnected/error/expired → red; not_configured/disabled → amber;
 * ready_to_connect / anything else → neutral gray.
 */
export const connStatusVariant = (s: string): 'ok' | 'warn' | 'err' | '' =>
  s === 'connected' ? 'ok'
    : (s === 'disconnected' || s === 'error' || s === 'expired') ? 'err'
    : (s === 'not_configured' || s === 'disabled') ? 'warn'
    : '';

export const SYNC_TYPES = ['account_identity_placeholder', 'performance_read', 'campaign_read', 'creative_read', 'manual_test_placeholder'] as const;
export const SYNC_RUN_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'skipped'] as const;
export const SYNC_SOURCES = ['provider_api', 'manual', 'system'] as const;

/** Fields that must NEVER be returned to clients / logged. */
export const CONNECTION_SECRET_FIELDS = ['accessTokenEncrypted', 'refreshTokenEncrypted'] as const;
