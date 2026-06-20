import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';
import { PROVIDERS, PROVIDER_BY_ID, CONNECTION_SECRET_FIELDS, type ProviderDef, type ProviderId } from './provider-constants';
import { encryptionKeyStatus } from './provider-crypto';

/**
 * Provider connection data layer + setup-status evaluator (Phase 30). Reads env
 * PRESENCE (names only — never values) to decide whether a provider is configured.
 * All connection reads are workspace-scoped and token fields are ALWAYS stripped
 * before leaving the server. No provider API is called here.
 */
export type ProviderSetup = {
  configured: boolean;          // all required env present (incl. vault key)
  missingEnv: string[];         // names only
  vaultStatus: 'ready' | 'missing' | 'invalid';
  comingSoon: boolean;
  setupStatus: 'disabled' | 'not_configured' | 'ready_to_connect';
};

/** Evaluate provider readiness from env presence (names only; never values). */
export function providerSetup(def: ProviderDef): ProviderSetup {
  const vaultStatus = encryptionKeyStatus();
  const missingEnv = def.requiredEnv.filter((name) => !String(process.env[name] ?? '').trim());
  const configured = def.requiredEnv.length > 0 && missingEnv.length === 0;
  const comingSoon = def.comingSoon;
  const setupStatus: ProviderSetup['setupStatus'] = comingSoon ? 'disabled' : (configured ? 'ready_to_connect' : 'not_configured');
  return { configured, missingEnv, vaultStatus, comingSoon, setupStatus };
}

/** Strip encrypted token fields (and any secrets) from a connection doc before it leaves the server. */
export function sanitizeConnection(d: Doc): Doc {
  const out: Doc = { ...d };
  for (const f of CONNECTION_SECRET_FIELDS) delete out[f];
  // Expose only a boolean presence flag, never the ciphertext.
  out.hasStoredToken = Boolean(d.accessTokenEncrypted);
  return out;
}

export async function listWorkspaceConnections(scope: WorkspaceScope): Promise<Doc[]> {
  const docs = await wsList(scope, 'provider-connections', { sort: '-updatedAt', limit: 200, depth: 0 });
  return docs.map(sanitizeConnection);
}

export async function getWorkspaceConnection(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'provider-connections', limit: 1, depth: 0, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null; // RAW (may include token fields) — callers must sanitize before returning to clients.
}

/** Latest connection record for a provider in this workspace (raw). */
export async function connectionForProvider(scope: WorkspaceScope, provider: ProviderId): Promise<Doc | null> {
  const docs = await wsList(scope, 'provider-connections', { sort: '-updatedAt', limit: 1, depth: 0, extra: { provider: { equals: provider } } });
  return docs[0] ?? null;
}

export type ProviderCard = {
  def: ProviderDef;
  setup: ProviderSetup;
  connection: Doc | null;        // sanitized
  effectiveStatus: string;       // status badge value
  connectable: boolean;          // owner/admin may start connect
};

/** Build the per-provider card list for the workspace UI (registry + env + existing record). */
export async function providerCards(scope: WorkspaceScope): Promise<ProviderCard[]> {
  const existing = await listWorkspaceConnections(scope); // sanitized
  const byProvider = new Map<string, Doc>();
  for (const c of existing) if (!byProvider.has(String(c.provider))) byProvider.set(String(c.provider), c);

  return PROVIDERS.map((def) => {
    const setup = providerSetup(def);
    const connection = byProvider.get(def.id) ?? null;
    const recordStatus = connection ? String(connection.status) : null;
    const effectiveStatus = recordStatus && recordStatus !== 'not_configured' ? recordStatus : setup.setupStatus;
    const connectable = !setup.comingSoon && setup.configured && (!connection || ['not_configured', 'ready_to_connect', 'disconnected', 'error', 'expired'].includes(recordStatus || ''));
    return { def, setup, connection, effectiveStatus, connectable };
  });
}

// ---- Phase 31: provider accounts + synced performance reads (workspace-scoped) ----

export async function listProviderAccounts(scope: WorkspaceScope, connectionId?: string | number): Promise<Doc[]> {
  const extra = connectionId != null ? { providerConnection: { equals: connectionId as never } } : undefined;
  return wsList(scope, 'provider-accounts', { sort: '-selected', limit: 100, depth: 0, extra });
}

export async function getSelectedAccount(scope: WorkspaceScope, connectionId: string | number): Promise<Doc | null> {
  const accounts = await listProviderAccounts(scope, connectionId);
  return accounts.find((a) => a.selected) ?? accounts[0] ?? null;
}

export async function listSyncRuns(scope: WorkspaceScope, connectionId: string | number, limit = 10): Promise<Doc[]> {
  return wsList(scope, 'provider-sync-runs', { sort: '-createdAt', limit, depth: 0, extra: { connection: { equals: connectionId as never } } });
}

/** Synced daily rows for the workspace (optionally filtered by provider). */
export async function listSyncedDaily(scope: WorkspaceScope, provider?: string): Promise<Doc[]> {
  const extra = provider ? { provider: { equals: provider } } : undefined;
  return wsList(scope, 'synced-performance-daily', { sort: '-metricDate', limit: 5000, depth: 0, extra });
}

/** Aggregate api-synced totals + top campaigns for the Performance dashboard (Google Ads). */
export async function syncedGoogleAdsOverview(scope: WorkspaceScope) {
  const rows = await listSyncedDaily(scope, 'google_ads');
  const totals = { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 };
  let currency = '';
  const byCampaign = new Map<string, { name: string; impressions: number; clicks: number; cost: number; conversions: number; conversionValue: number }>();
  for (const r of rows) {
    totals.impressions += Number(r.impressions || 0); totals.clicks += Number(r.clicks || 0); totals.cost += Number(r.cost || 0);
    totals.conversions += Number(r.conversions || 0); totals.conversionValue += Number(r.conversionValue || 0);
    if (!currency && r.currencyCode) currency = String(r.currencyCode);
    const key = String(r.campaignId || r.campaignName || '—');
    const cur = byCampaign.get(key) || { name: String(r.campaignName || r.campaignId || '—'), impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 };
    cur.impressions += Number(r.impressions || 0); cur.clicks += Number(r.clicks || 0); cur.cost += Number(r.cost || 0);
    cur.conversions += Number(r.conversions || 0); cur.conversionValue += Number(r.conversionValue || 0);
    byCampaign.set(key, cur);
  }
  const topCampaigns = [...byCampaign.values()]
    .map((c) => ({ ...c, roas: c.cost > 0 ? c.conversionValue / c.cost : null }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  return { rowCount: rows.length, totals, currency, topCampaigns };
}

export { PROVIDERS, PROVIDER_BY_ID };
