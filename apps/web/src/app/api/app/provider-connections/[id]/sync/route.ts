import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection, getSelectedAccount } from '@/lib/providers';
import { googleAdsEnv } from '@/lib/providers/google-ads-auth';
import { getValidAccessToken, runGoogleAdsCampaignSync } from '@/lib/providers/google-ads-sync';

/**
 * Trigger a READ-ONLY Google Ads sync (Phase 31). Owner/admin + workspace-scoped.
 * Creates a provider_sync_run, pulls campaign-daily metrics into synced_performance_daily,
 * and records counts. NEVER mutates Google Ads. Env-missing/not-connected → safe 422.
 */
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
type Ctx = { params: Promise<{ id: string }> };
const MAX_WINDOW_DAYS = 90;

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can run a sync.' }, { status: 403 });
  const connection = await getWorkspaceConnection(ws.scope, id);
  if (!connection) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  if (String(connection.provider) !== 'google_ads') return NextResponse.json({ ok: false, error: 'Sync is only available for Google Ads in this phase.' }, { status: 422 });

  const e = googleAdsEnv();
  if (!e.configured) return NextResponse.json({ ok: false, code: 'not_configured', missingEnv: e.missingEnv, error: 'Google Ads is not configured.' }, { status: 422 });
  if (connection.status !== 'connected' || !connection.accessTokenEncrypted) return NextResponse.json({ ok: false, code: 'not_connected', error: 'Connect Google Ads before syncing.' }, { status: 422 });

  const account = await getSelectedAccount(ws.scope, id);
  const customerId = String((account?.providerAccountId as string) || (connection.providerAccountId as string) || '').replace(/[^0-9]/g, '');
  if (!customerId) return NextResponse.json({ ok: false, code: 'no_account', error: 'No Google Ads account is selected to sync.' }, { status: 422 });

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
    data: { provider: 'google_ads', connection: connection.id, syncType: 'performance_read', status: 'running',
      source: 'provider_api', startedAt: new Date().toISOString(), windowStart: startDate, windowEnd: endDate,
      tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never,
  });

  try {
    const accessToken = await getValidAccessToken(payload, connection);
    const result = await runGoogleAdsCampaignSync(payload, ws.scope, connection, account, run.id as never, accessToken, customerId, startDate, endDate);
    await payload.update({ collection: 'provider-sync-runs', id: run.id as never, overrideAccess: true,
      data: { status: 'succeeded', finishedAt: new Date().toISOString(), recordsRead: result.read, recordsWritten: result.written } as never });
    await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
      data: { lastSyncAt: new Date().toISOString(), lastErrorCode: null, lastErrorMessage: null } as never });
    return NextResponse.json({ ok: true, syncRunId: run.id, recordsRead: result.read, recordsWritten: result.written, windowStart: startDate, windowEnd: endDate });
  } catch (err) {
    const code = (err instanceof Error ? err.message : 'sync_failed').slice(0, 80);
    await payload.update({ collection: 'provider-sync-runs', id: run.id as never, overrideAccess: true,
      data: { status: 'failed', finishedAt: new Date().toISOString(), errorCode: code, errorMessage: 'Sync failed. Check the connection and try again.' } as never }).catch(() => {});
    await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true,
      data: { lastErrorCode: code, lastErrorMessage: 'Last sync failed.' } as never }).catch(() => {});
    return NextResponse.json({ ok: false, code: 'sync_failed', syncRunId: run.id, error: 'Sync failed. Please try again.' }, { status: 502 });
  }
}
