import type { Payload } from 'payload';
import type { WorkspaceScope } from '../workspace';
import type { Doc } from '../tenant';
import { decryptToken, encryptToken } from '../provider-crypto';
import { refreshAccessToken } from './google-ads-auth';
import { searchStream } from './google-ads';
import { campaignDailyGaql } from './google-ads-queries';
import { normalizeCampaignRow } from './google-ads-normalize';

/**
 * Google Ads sync orchestration (Phase 31) — server-only, READ-ONLY. Decrypts vault
 * tokens, refreshes when expired (persisting the re-encrypted token), runs the GAQL
 * campaign-daily report, and writes normalized synced_performance_daily rows. Never
 * logs token values; never calls a mutate endpoint.
 */

/** Return a valid access token for the connection, refreshing + persisting if expired. */
export async function getValidAccessToken(payload: Payload, connection: Doc): Promise<string> {
  const enc = connection.accessTokenEncrypted as string | undefined;
  if (!enc) throw new Error('not_connected');
  const expiresAt = connection.tokenExpiresAt ? new Date(String(connection.tokenExpiresAt)).getTime() : 0;
  const stillValid = expiresAt && expiresAt - Date.now() > 60_000;
  if (stillValid) return decryptToken(enc);

  // Expired (or unknown expiry) → refresh if we have a refresh token.
  const encRefresh = connection.refreshTokenEncrypted as string | undefined;
  if (!encRefresh) return decryptToken(enc); // best effort with current token
  const refreshed = await refreshAccessToken(decryptToken(encRefresh));
  const newExpiry = new Date(Date.now() + refreshed.expiresInSec * 1000).toISOString();
  await payload.update({
    collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
    data: { accessTokenEncrypted: encryptToken(refreshed.accessToken), tokenExpiresAt: newExpiry, lastRefreshedAt: new Date().toISOString() } as never,
  });
  return refreshed.accessToken;
}

export type SyncResult = { read: number; written: number };

/**
 * Run the campaign-daily read sync for one customer over [startDate,endDate]. Idempotent
 * for the window: existing rows for this (connection) within the date range are removed
 * first, then re-inserted. Returns row counts.
 */
export async function runGoogleAdsCampaignSync(
  payload: Payload, scope: WorkspaceScope, connection: Doc, account: Doc | null,
  syncRunId: string | number, accessToken: string, customerId: string, startDate: string, endDate: string,
): Promise<SyncResult> {
  const rows = await searchStream(customerId, campaignDailyGaql(startDate, endDate), accessToken);
  const normalized = rows.map(normalizeCampaignRow).filter((r): r is NonNullable<typeof r> => r != null && r.metricDate >= startDate && r.metricDate <= endDate);

  // Idempotent window replace: remove this connection's rows in [start,end] first (scoped).
  await payload.delete({
    collection: 'synced-performance-daily', overrideAccess: true,
    where: { and: [
      { providerConnection: { equals: connection.id as never } },
      { workspace: { equals: scope.workspaceId as never } },
      { metricDate: { greater_than_equal: startDate } },
      { metricDate: { less_than_equal: endDate } },
    ] },
  }).catch(() => { /* nothing to delete is fine */ });

  const now = new Date().toISOString();
  let written = 0;
  for (const r of normalized) {
    await payload.create({
      collection: 'synced-performance-daily', overrideAccess: true,
      data: {
        provider: 'google_ads', providerConnection: connection.id, providerAccount: account?.id ?? undefined,
        customerId: r.customerId || customerId, metricDate: r.metricDate,
        campaignId: r.campaignId || undefined, campaignName: r.campaignName || undefined,
        campaignStatus: r.campaignStatus || undefined, campaignChannelType: r.campaignChannelType || undefined,
        impressions: r.impressions, clicks: r.clicks, costMicros: r.costMicros, cost: r.cost,
        conversions: r.conversions, conversionValue: r.conversionValue, currencyCode: r.currencyCode || undefined,
        source: 'api_synced', syncedAt: now, syncRun: syncRunId,
        tenant: scope.tenantId, workspace: scope.workspaceId,
      } as never,
    });
    written++;
  }
  return { read: rows.length, written };
}
