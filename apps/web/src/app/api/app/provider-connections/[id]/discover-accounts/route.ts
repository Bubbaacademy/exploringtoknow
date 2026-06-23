import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection } from '@/lib/providers';
import { googleAdsEnv } from '@/lib/providers/google-ads-auth';
import { listAccessibleCustomers, searchStream } from '@/lib/providers/google-ads';
import { customerInfoGaql } from '@/lib/providers/google-ads-queries';
import { getValidAccessToken } from '@/lib/providers/google-ads-sync';

/**
 * Discover the Google Ads accounts a connection can read (Phase 31A). Owner/admin/super
 * + workspace-scoped. READ-ONLY: listAccessibleCustomers + a customer-info read per
 * account. Upserts workspace-scoped provider-accounts and auto-selects the first when
 * none is selected. No mutate/launch/spend. Env-missing/not-connected → safe 422.
 */
const s = (v: unknown) => (v == null ? '' : String(v));
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can discover accounts.' }, { status: 403 });
  const connection = await getWorkspaceConnection(ws.scope, id);
  if (!connection) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  if (String(connection.provider) !== 'google_ads') return NextResponse.json({ ok: false, error: 'Account discovery is only available for Google Ads in this phase.' }, { status: 422 });

  const e = googleAdsEnv();
  if (!e.configured) return NextResponse.json({ ok: false, code: 'not_configured', error: 'Google Ads isn’t available yet.' }, { status: 422 });
  if (connection.status !== 'connected' || !connection.accessTokenEncrypted) return NextResponse.json({ ok: false, code: 'not_connected', error: 'Connect Google Ads before discovering accounts.' }, { status: 422 });

  try {
    const payload = await getPayload({ config });
    const accessToken = await getValidAccessToken(payload, connection);
    const customers = await listAccessibleCustomers(accessToken);

    const existing = await payload.find({ collection: 'provider-accounts', overrideAccess: true, limit: 200, depth: 0,
      where: { and: [{ provider: { equals: 'google_ads' } }, { providerConnection: { equals: connection.id as never } }, { workspace: { equals: ws.scope.workspaceId } }] } });
    const byId = new Map((existing.docs as Array<Record<string, unknown>>).map((a) => [String(a.providerAccountId), a]));
    let anySelected = (existing.docs as Array<Record<string, unknown>>).some((a) => a.selected);
    const now = new Date().toISOString();

    for (const customerId of customers) {
      // Best-effort read-only customer info (name/currency/timezone/manager).
      let name = '', currency = '', tz = '', manager = false;
      try {
        const rows = await searchStream(customerId, customerInfoGaql(), accessToken);
        const c = (rows[0]?.customer ?? {}) as Record<string, unknown>;
        name = s(c.descriptiveName); currency = s(c.currencyCode); tz = s(c.timeZone); manager = c.manager === true || c.manager === 'true';
      } catch { /* id-only fallback */ }

      const prior = byId.get(customerId);
      const selectThis = !anySelected;
      if (prior) {
        await payload.update({ collection: 'provider-accounts', id: prior.id as never, overrideAccess: true,
          data: { providerAccountName: name || undefined, currencyCode: currency || undefined, timeZone: tz || undefined, status: 'active', lastFetchedAt: now } as never });
      } else {
        await payload.create({ collection: 'provider-accounts', overrideAccess: true,
          data: { provider: 'google_ads', providerConnection: connection.id, providerAccountId: customerId,
            providerAccountName: name || undefined, currencyCode: currency || undefined, timeZone: tz || undefined,
            managerCustomerId: manager ? customerId : undefined, status: 'active', selected: selectThis, lastFetchedAt: now,
            tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never });
        if (selectThis) { anySelected = true; await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true, data: { providerAccountId: customerId } as never }); }
      }
    }
    return NextResponse.json({ ok: true, discovered: customers.length });
  } catch (err) {
    const code = (err instanceof Error ? err.message : 'discover_failed').slice(0, 80);
    return NextResponse.json({ ok: false, code: 'discover_failed', error: 'Could not discover accounts. If your developer token is at Test access, connect a Google Ads test account; a real account needs Basic access.', detail: code }, { status: 502 });
  }
}
