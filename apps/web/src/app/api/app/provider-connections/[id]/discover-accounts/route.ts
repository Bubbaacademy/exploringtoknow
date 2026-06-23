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
import { metaAdsEnv } from '@/lib/providers/meta-ads-auth';
import { listAdAccounts } from '@/lib/providers/meta-ads';
import { getValidMetaToken } from '@/lib/providers/meta-ads-sync';

/**
 * Discover the ad accounts a connection can read (Phase 31A Google Ads / Phase 32 Meta).
 * Owner/admin/super + workspace-scoped. READ-ONLY: lists accessible accounts + reads each
 * account's identity. Upserts workspace-scoped provider-accounts and auto-selects the
 * first when none is selected. No mutate/launch/spend. Env-missing/not-connected → safe 422.
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
  const provider = String(connection.provider);

  // ---- Google Ads ----
  if (provider === 'google_ads') {
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
      const detail = (err instanceof Error ? err.message : 'discover_failed').slice(0, 280);
      console.warn('[google-ads discover] failed:', detail);
      try {
        const payload = await getPayload({ config });
        await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true, data: { lastErrorCode: 'discover_failed', lastErrorMessage: detail } as never });
      } catch { /* ignore */ }
      return NextResponse.json({ ok: false, code: 'discover_failed', error: 'Could not discover accounts. If your developer token is at Test access, connect a Google Ads test account; a real account needs Basic access.', detail }, { status: 502 });
    }
  }

  // ---- Meta Ads ----
  if (provider === 'meta_ads') {
    const e = metaAdsEnv();
    if (!e.configured) return NextResponse.json({ ok: false, code: 'not_configured', error: 'Meta Ads isn’t available yet.' }, { status: 422 });
    if (connection.status !== 'connected' || !connection.accessTokenEncrypted) return NextResponse.json({ ok: false, code: 'not_connected', error: 'Connect Meta Ads before discovering accounts.' }, { status: 422 });

    try {
      const payload = await getPayload({ config });
      const accessToken = await getValidMetaToken(payload, connection);
      const accounts = await listAdAccounts(accessToken);

      const existing = await payload.find({ collection: 'provider-accounts', overrideAccess: true, limit: 200, depth: 0,
        where: { and: [{ provider: { equals: 'meta_ads' } }, { providerConnection: { equals: connection.id as never } }, { workspace: { equals: ws.scope.workspaceId } }] } });
      const byId = new Map((existing.docs as Array<Record<string, unknown>>).map((a) => [String(a.providerAccountId), a]));
      let anySelected = (existing.docs as Array<Record<string, unknown>>).some((a) => a.selected);
      const now = new Date().toISOString();

      for (const acct of accounts) {
        const prior = byId.get(acct.accountId);
        const selectThis = !anySelected;
        if (prior) {
          await payload.update({ collection: 'provider-accounts', id: prior.id as never, overrideAccess: true,
            data: { providerAccountName: acct.name || undefined, currencyCode: acct.currency || undefined, timeZone: acct.timeZone || undefined, status: 'active', lastFetchedAt: now } as never });
        } else {
          await payload.create({ collection: 'provider-accounts', overrideAccess: true,
            data: { provider: 'meta_ads', providerConnection: connection.id, providerAccountId: acct.accountId,
              providerAccountName: acct.name || undefined, currencyCode: acct.currency || undefined, timeZone: acct.timeZone || undefined,
              status: 'active', selected: selectThis, lastFetchedAt: now,
              tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never });
          if (selectThis) { anySelected = true; await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true, data: { providerAccountId: acct.accountId } as never }); }
        }
      }
      return NextResponse.json({ ok: true, discovered: accounts.length });
    } catch (err) {
      const detail = (err instanceof Error ? err.message : 'discover_failed').slice(0, 280);
      console.warn('[meta-ads discover] failed:', detail);
      try {
        const payload = await getPayload({ config });
        await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true, data: { lastErrorCode: 'discover_failed', lastErrorMessage: detail } as never });
      } catch { /* ignore */ }
      return NextResponse.json({ ok: false, code: 'discover_failed', error: 'Could not discover ad accounts. If access was just granted, reconnect Meta; a real account needs your Meta app to have ads_read approved (Advanced Access).', detail }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: false, error: 'Account discovery is not available for this provider yet.' }, { status: 422 });
}
