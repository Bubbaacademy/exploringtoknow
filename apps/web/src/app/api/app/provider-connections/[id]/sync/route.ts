import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { Payload } from 'payload';
import { resolveWorkspace, type WorkspaceScope } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection, getSelectedAccount } from '@/lib/providers';
import type { Doc } from '@/lib/tenant';
import { googleAdsEnv } from '@/lib/providers/google-ads-auth';
import { getValidAccessToken, runGoogleAdsCampaignSync } from '@/lib/providers/google-ads-sync';
import { metaAdsEnv } from '@/lib/providers/meta-ads-auth';
import { getValidMetaToken, runMetaInsightsSync } from '@/lib/providers/meta-ads-sync';

/**
 * Trigger a READ-ONLY ad-metrics sync (Phase 31 Google Ads / Phase 32 Meta). Owner/admin
 * + workspace-scoped. Creates a provider_sync_run, pulls campaign-daily metrics into
 * synced_performance_daily, and records counts. NEVER mutates the provider. Env-missing/
 * not-connected → safe 422.
 */
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
type Ctx = { params: Promise<{ id: string }> };
const MAX_WINDOW_DAYS = 90;

type SyncResult = { read: number; written: number };
type ProviderSync = {
  label: string;
  configured: boolean;
  missingEnv: string[];
  getToken: (payload: Payload, connection: Doc) => Promise<string>;
  run: (payload: Payload, scope: WorkspaceScope, connection: Doc, account: Doc | null, runId: string | number, token: string, accountId: string, start: string, end: string) => Promise<SyncResult>;
};

/** Resolve the provider-specific env + token + read-sync runner (read-only). */
function resolveProviderSync(provider: string): ProviderSync | null {
  if (provider === 'google_ads') {
    const e = googleAdsEnv();
    return { label: 'Google Ads', configured: e.configured, missingEnv: e.missingEnv, getToken: getValidAccessToken, run: runGoogleAdsCampaignSync };
  }
  if (provider === 'meta_ads') {
    const e = metaAdsEnv();
    return { label: 'Meta Ads', configured: e.configured, missingEnv: e.missingEnv, getToken: getValidMetaToken, run: runMetaInsightsSync };
  }
  return null;
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can run a sync.' }, { status: 403 });
  const connection = await getWorkspaceConnection(ws.scope, id);
  if (!connection) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  const provider = String(connection.provider);

  const ps = resolveProviderSync(provider);
  if (!ps) return NextResponse.json({ ok: false, error: 'Sync is not available for this provider yet.' }, { status: 422 });
  if (!ps.configured) return NextResponse.json({ ok: false, code: 'not_configured', missingEnv: ps.missingEnv, error: `${ps.label} isn’t available yet — ExploringToKnow is finishing ${ps.label} API setup.` }, { status: 422 });
  if (connection.status !== 'connected' || !connection.accessTokenEncrypted) return NextResponse.json({ ok: false, code: 'not_connected', error: `Connect ${ps.label} before syncing.` }, { status: 422 });

  const account = await getSelectedAccount(ws.scope, id);
  const accountId = String((account?.providerAccountId as string) || (connection.providerAccountId as string) || '').replace(/[^0-9]/g, '');
  if (!accountId) return NextResponse.json({ ok: false, code: 'no_account', error: `No ${ps.label} account is selected to sync.` }, { status: 422 });

  // Date window (default last 30 days; max 90).
  let body: Record<string, unknown>; try { body = await req.json(); } catch { body = {}; }
  const today = new Date();
  let endDate = typeof body.endDate === 'string' && isDate(body.endDate) ? body.endDate : ymd(today);
  let startDate = typeof body.startDate === 'string' && isDate(body.startDate) ? body.startDate : ymd(new Date(today.getTime() - 29 * 86400000));
  if (startDate > endDate) [startDate, endDate] = [endDate, startDate];
  const span = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
  if (span > MAX_WINDOW_DAYS) startDate = ymd(new Date(new Date(endDate).getTime() - MAX_WINDOW_DAYS * 86400000));

  const payload = await getPayload({ config });
  const run = await payload.create({
    collection: 'provider-sync-runs', overrideAccess: true,
    data: { provider, connection: connection.id, syncType: 'performance_read', status: 'running',
      source: 'provider_api', startedAt: new Date().toISOString(), windowStart: startDate, windowEnd: endDate,
      tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never,
  });

  try {
    const accessToken = await ps.getToken(payload, connection);
    const result = await ps.run(payload, ws.scope, connection, account, run.id as never, accessToken, accountId, startDate, endDate);
    await payload.update({ collection: 'provider-sync-runs', id: run.id as never, overrideAccess: true,
      data: { status: 'succeeded', finishedAt: new Date().toISOString(), recordsRead: result.read, recordsWritten: result.written } as never });
    await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
      data: { lastSyncAt: new Date().toISOString(), lastErrorCode: null, lastErrorMessage: null } as never });
    return NextResponse.json({ ok: true, syncRunId: run.id, recordsRead: result.read, recordsWritten: result.written, windowStart: startDate, windowEnd: endDate });
  } catch (err) {
    const detail = (err instanceof Error ? err.message : 'sync_failed').slice(0, 280);
    console.warn(`[${provider} sync] failed:`, detail);
    await payload.update({ collection: 'provider-sync-runs', id: run.id as never, overrideAccess: true,
      data: { status: 'failed', finishedAt: new Date().toISOString(), errorCode: detail.slice(0, 80), errorMessage: detail } as never }).catch(() => {});
    await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
      data: { lastErrorCode: 'sync_failed', lastErrorMessage: detail } as never }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'sync_failed', syncRunId: run.id, error: 'Sync failed.', detail }, { status: 502 });
  }
}
