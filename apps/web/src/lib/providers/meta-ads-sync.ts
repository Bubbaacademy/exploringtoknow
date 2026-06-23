import type { Payload } from 'payload';
import type { WorkspaceScope } from '../workspace';
import type { Doc } from '../tenant';
import { decryptToken, encryptToken } from '../provider-crypto';
import { exchangeForLongLivedToken } from './meta-ads-auth';
import { getCampaignDailyInsights } from './meta-ads';
import { normalizeInsightRow } from './meta-ads-normalize';

/**
 * Meta Ads sync orchestration (Phase 32) — server-only, READ-ONLY. Decrypts the vault
 * token, opportunistically re-extends a long-lived token nearing expiry (Meta has NO
 * refresh token), runs the campaign-daily insights read, and writes normalized
 * synced_performance_daily rows. Never logs token values; never calls a write endpoint.
 */

const SEVEN_DAYS = 7 * 86400 * 1000;

/**
 * Return a valid Meta access token for the connection. Meta issues no refresh token, so an
 * EXPIRED token requires the workspace owner to reconnect (`reauth_required`). When the
 * token is still valid but within 7 days of expiry, we re-extend it via fb_exchange_token
 * and persist the re-encrypted long-lived token (best-effort; non-fatal on failure).
 */
export async function getValidMetaToken(payload: Payload, connection: Doc): Promise<string> {
  const enc = connection.accessTokenEncrypted as string | undefined;
  if (!enc) throw new Error('not_connected');
  const token = decryptToken(enc);
  const expiresAt = connection.tokenExpiresAt ? new Date(String(connection.tokenExpiresAt)).getTime() : 0;
  if (expiresAt && expiresAt <= Date.now()) throw new Error('reauth_required');

  if (expiresAt && expiresAt - Date.now() < SEVEN_DAYS) {
    try {
      const refreshed = await exchangeForLongLivedToken(token);
      const newExpiry = new Date(Date.now() + refreshed.expiresInSec * 1000).toISOString();
      await payload.update({
        collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
        data: { accessTokenEncrypted: encryptToken(refreshed.accessToken), tokenExpiresAt: newExpiry, lastRefreshedAt: new Date().toISOString() } as never,
      });
      return refreshed.accessToken;
    } catch { /* keep the still-valid current token */ }
  }
  return token;
}

export type SyncResult = { read: number; written: number };

/**
 * Run the campaign-daily insights read for one ad account over [startDate,endDate].
 * Idempotent for the window: existing rows for this connection within the date range are
 * removed first, then re-inserted. Returns row counts. READ-ONLY.
 */
export async function runMetaInsightsSync(
  payload: Payload, scope: WorkspaceScope, connection: Doc, account: Doc | null,
  syncRunId: string | number, accessToken: string, accountId: string, startDate: string, endDate: string,
): Promise<SyncResult> {
  const currency = String((account?.currencyCode as string) || '');
  const rows = await getCampaignDailyInsights(accountId, accessToken, startDate, endDate);
  const normalized = rows
    .map((r) => normalizeInsightRow(r, accountId, currency))
    .filter((r): r is NonNullable<typeof r> => r != null && r.metricDate >= startDate && r.metricDate <= endDate);

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
        provider: 'meta_ads', providerConnection: connection.id, providerAccount: account?.id ?? undefined,
        customerId: r.customerId || accountId, metricDate: r.metricDate,
        campaignId: r.campaignId || undefined, campaignName: r.campaignName || undefined,
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
