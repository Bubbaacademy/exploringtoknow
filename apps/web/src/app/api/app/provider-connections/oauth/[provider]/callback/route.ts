import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { isProviderId, PROVIDER_BY_ID } from '@/lib/provider-constants';
import { encryptionReady, verifyState, encryptToken } from '@/lib/provider-crypto';
import { connectionForProvider } from '@/lib/providers';
import { googleAdsEnv, exchangeCodeForTokens } from '@/lib/providers/google-ads-auth';
import { listAccessibleCustomers } from '@/lib/providers/google-ads';
import { metaAdsEnv, exchangeCodeForToken, exchangeForLongLivedToken } from '@/lib/providers/meta-ads-auth';
import { listAdAccounts } from '@/lib/providers/meta-ads';

/**
 * OAuth CALLBACK (Phase 30 foundation + Phase 31 Google Ads live). Validates the
 * signed, workspace-bound state. For google_ads when configured: exchanges the code,
 * stores ENCRYPTED tokens in the vault, marks the connection connected, and fetches
 * accessible accounts (read-only). For other providers / unconfigured env: NO token
 * exchange. Token values are never logged or returned. On failure the connection is
 * set to `error` without exposing secrets.
 */
type Ctx = { params: Promise<{ provider: string }> };

function detailRedirect(suffix: string): NextResponse {
  const base = (process.env.PAYLOAD_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
  return NextResponse.redirect(`${base}/app/provider-connections/google_ads${suffix}`);
}

/** Provider-aware redirect back to the connection detail page (used by non-Google providers). */
function providerRedirect(provider: string, suffix: string): NextResponse {
  const base = (process.env.PAYLOAD_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
  return NextResponse.redirect(`${base}/app/provider-connections/${provider}${suffix}`);
}

export async function GET(req: Request, { params }: Ctx) {
  const { provider } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!isProviderId(provider)) return NextResponse.json({ ok: false, error: 'Unknown provider.' }, { status: 422 });

  const url = new URL(req.url);
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code') || '';
  const providerError = url.searchParams.get('error');

  if (!encryptionReady()) return NextResponse.json({ ok: false, code: 'not_configured', error: 'Provider connections are not configured.' }, { status: 422 });
  if (!state) return NextResponse.json({ ok: false, code: 'missing_state', error: 'Missing OAuth state.' }, { status: 400 });
  const decoded = verifyState(state);
  if (!decoded || decoded.provider !== provider) return NextResponse.json({ ok: false, code: 'invalid_state', error: 'Invalid OAuth state.' }, { status: 400 });
  if (String(decoded.workspaceId) !== String(ws.scope.workspaceId)) return NextResponse.json({ ok: false, code: 'workspace_mismatch', error: 'OAuth state does not match this workspace.' }, { status: 403 });

  // ---- Google Ads live path (only when configured) ----
  if (provider === 'google_ads') {
    const e = googleAdsEnv();
    if (!e.configured) return NextResponse.json({ ok: false, code: 'not_configured', missingEnv: e.missingEnv, error: 'Google Ads is not configured.' }, { status: 422 });
    if (providerError) return detailRedirect('?error=authorization_denied');
    if (!code) return NextResponse.json({ ok: false, code: 'missing_code', error: 'Missing authorization code.' }, { status: 400 });

    const payload = await getPayload({ config });
    const existing = await connectionForProvider(ws.scope, 'google_ads');
    try {
      const tokens = await exchangeCodeForTokens(code);
      const expiresAt = new Date(Date.now() + tokens.expiresInSec * 1000).toISOString();
      const data: Record<string, unknown> = {
        provider: 'google_ads', connectionType: 'oauth', status: 'connected',
        displayName: existing?.displayName || PROVIDER_BY_ID.google_ads!.displayName,
        scopes: PROVIDER_BY_ID.google_ads!.scopes, tokenType: 'Bearer',
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : undefined,
        tokenExpiresAt: expiresAt, lastConnectedAt: new Date().toISOString(), connectedBy: ws.ctx.user.id,
        lastErrorCode: null, lastErrorMessage: null,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      };
      let connId: string | number;
      if (existing) { await payload.update({ collection: 'provider-connections', id: existing.id as never, overrideAccess: true, data: data as never }); connId = existing.id as string | number; }
      else { const c = await payload.create({ collection: 'provider-connections', overrideAccess: true, data: data as never }); connId = c.id as string | number; }

      // Read-only account identity fetch.
      try {
        const customers = await listAccessibleCustomers(tokens.accessToken);
        const acctR = await payload.find({ collection: 'provider-accounts', overrideAccess: true, limit: 200, depth: 0, where: { and: [{ provider: { equals: 'google_ads' } }, { providerConnection: { equals: connId as never } }, { workspace: { equals: ws.scope.workspaceId } }] } });
        const haveSelected = (acctR.docs as Array<Record<string, unknown>>).some((a) => a.selected);
        const existingIds = new Set((acctR.docs as Array<Record<string, unknown>>).map((a) => String(a.providerAccountId)));
        let first = true;
        for (const customerId of customers) {
          if (existingIds.has(customerId)) { first = false; continue; }
          await payload.create({ collection: 'provider-accounts', overrideAccess: true, data: {
            provider: 'google_ads', providerConnection: connId, providerAccountId: customerId, status: 'active',
            selected: !haveSelected && first, lastFetchedAt: new Date().toISOString(),
            tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
          } as never });
          if (!haveSelected && first) await payload.update({ collection: 'provider-connections', id: connId as never, overrideAccess: true, data: { providerAccountId: customerId } as never });
          first = false;
        }
      } catch (discErr) {
        // Best-effort: connection still counts as connected, but record the SANITIZED reason
        // (no tokens/headers) so the UI shows it and the operator can retry "Discover accounts".
        const m = (discErr instanceof Error ? discErr.message : 'account_discovery_failed').slice(0, 280);
        console.warn('[google-ads callback] account discovery failed:', m);
        try { await payload.update({ collection: 'provider-connections', id: connId as never, overrideAccess: true, data: { lastErrorCode: 'account_discovery_failed', lastErrorMessage: m } as never }); } catch { /* ignore */ }
      }

      return detailRedirect('?connected=1');
    } catch {
      if (existing) await payload.update({ collection: 'provider-connections', id: existing.id as never, overrideAccess: true, data: { status: 'error', lastErrorCode: 'token_exchange_failed', lastErrorMessage: 'Authorization failed. Please try connecting again.' } as never }).catch(() => {});
      return detailRedirect('?error=token_exchange_failed');
    }
  }

  // ---- Meta Ads live path (only when configured) ----
  if (provider === 'meta_ads') {
    const e = metaAdsEnv();
    if (!e.configured) return NextResponse.json({ ok: false, code: 'not_configured', missingEnv: e.missingEnv, error: 'Meta Ads is not configured.' }, { status: 422 });
    if (providerError) return providerRedirect('meta_ads', '?error=authorization_denied');
    if (!code) return NextResponse.json({ ok: false, code: 'missing_code', error: 'Missing authorization code.' }, { status: 400 });

    const payload = await getPayload({ config });
    const existing = await connectionForProvider(ws.scope, 'meta_ads');
    try {
      // Short-lived user token → upgrade to a long-lived (~60-day) token. Meta has no refresh token.
      const shortLived = await exchangeCodeForToken(code);
      const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
      const expiresAt = new Date(Date.now() + longLived.expiresInSec * 1000).toISOString();
      const data: Record<string, unknown> = {
        provider: 'meta_ads', connectionType: 'oauth', status: 'connected',
        displayName: existing?.displayName || PROVIDER_BY_ID.meta_ads!.displayName,
        scopes: ['ads_read'], tokenType: 'Bearer',
        accessTokenEncrypted: encryptToken(longLived.accessToken),
        refreshTokenEncrypted: undefined, // Meta issues no refresh token
        tokenExpiresAt: expiresAt, lastConnectedAt: new Date().toISOString(), connectedBy: ws.ctx.user.id,
        lastErrorCode: null, lastErrorMessage: null,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      };
      let connId: string | number;
      if (existing) { await payload.update({ collection: 'provider-connections', id: existing.id as never, overrideAccess: true, data: data as never }); connId = existing.id as string | number; }
      else { const c = await payload.create({ collection: 'provider-connections', overrideAccess: true, data: data as never }); connId = c.id as string | number; }

      // Read-only ad-account discovery.
      try {
        const accounts = await listAdAccounts(longLived.accessToken);
        const acctR = await payload.find({ collection: 'provider-accounts', overrideAccess: true, limit: 200, depth: 0, where: { and: [{ provider: { equals: 'meta_ads' } }, { providerConnection: { equals: connId as never } }, { workspace: { equals: ws.scope.workspaceId } }] } });
        const haveSelected = (acctR.docs as Array<Record<string, unknown>>).some((a) => a.selected);
        const existingIds = new Set((acctR.docs as Array<Record<string, unknown>>).map((a) => String(a.providerAccountId)));
        let first = true;
        for (const acct of accounts) {
          if (existingIds.has(acct.accountId)) { first = false; continue; }
          const selectThis = !haveSelected && first;
          await payload.create({ collection: 'provider-accounts', overrideAccess: true, data: {
            provider: 'meta_ads', providerConnection: connId, providerAccountId: acct.accountId,
            providerAccountName: acct.name || undefined, currencyCode: acct.currency || undefined, timeZone: acct.timeZone || undefined,
            status: 'active', selected: selectThis, lastFetchedAt: new Date().toISOString(),
            tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
          } as never });
          if (selectThis) await payload.update({ collection: 'provider-connections', id: connId as never, overrideAccess: true, data: { providerAccountId: acct.accountId } as never });
          first = false;
        }
      } catch (discErr) {
        const m = (discErr instanceof Error ? discErr.message : 'account_discovery_failed').slice(0, 280);
        console.warn('[meta-ads callback] account discovery failed:', m);
        try { await payload.update({ collection: 'provider-connections', id: connId as never, overrideAccess: true, data: { lastErrorCode: 'account_discovery_failed', lastErrorMessage: m } as never }); } catch { /* ignore */ }
      }

      return providerRedirect('meta_ads', '?connected=1');
    } catch {
      if (existing) await payload.update({ collection: 'provider-connections', id: existing.id as never, overrideAccess: true, data: { status: 'error', lastErrorCode: 'token_exchange_failed', lastErrorMessage: 'Authorization failed. Please try connecting again.' } as never }).catch(() => {});
      return providerRedirect('meta_ads', '?error=token_exchange_failed');
    }
  }

  // Foundation-only for other providers: state verified, no token exchange.
  return NextResponse.json({ ok: true, exchanged: false, provider, message: 'OAuth state verified. Live connect for this provider is enabled in a later phase.' });
}
