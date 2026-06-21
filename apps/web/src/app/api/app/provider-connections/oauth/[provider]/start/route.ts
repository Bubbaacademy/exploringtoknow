import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { providerSetup } from '@/lib/providers';
import { PROVIDER_BY_ID, isProviderId } from '@/lib/provider-constants';
import { signState } from '@/lib/provider-crypto';
import { buildConsentUrl } from '@/lib/providers/google-ads-auth';

/**
 * OAuth START (Phase 30 foundation + Phase 31 Google Ads live). Owner/admin only.
 * Env-missing → 422 `not_configured` (NAMES only). For google_ads when fully configured,
 * returns the Google consent `authorizeUrl` (signed, workspace-bound state) for the
 * client to redirect to — NO provider API is called here. Other configured providers
 * remain foundation-only (connect deferred). Performs no token exchange.
 */
type Ctx = { params: Promise<{ provider: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { provider } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can connect providers.' }, { status: 403 });
  if (!isProviderId(provider)) return NextResponse.json({ ok: false, error: 'Unknown provider.' }, { status: 422 });
  const def = PROVIDER_BY_ID[provider]!;
  if (def.comingSoon) return NextResponse.json({ ok: false, code: 'coming_soon', error: 'This provider is not available to connect yet.' }, { status: 422 });

  const setup = providerSetup(def);
  if (!setup.configured) {
    return NextResponse.json({ ok: false, code: 'not_configured', missingEnv: setup.missingEnv, vaultStatus: setup.vaultStatus,
      error: 'This provider isn’t available to connect yet — ExploringToKnow is finishing the provider’s API setup.' }, { status: 422 });
  }

  if (provider === 'google_ads') {
    // Live consent URL with signed, workspace-bound state. No provider call here.
    const nonce = crypto.randomUUID();
    const state = signState({ workspaceId: String(ws.scope.workspaceId), provider: 'google_ads', nonce });
    const authorizeUrl = buildConsentUrl(state);
    return NextResponse.json({ ok: true, ready: true, connectEnabled: true, provider, authorizeUrl,
      message: 'Redirecting to Google for read-only authorization. Nothing in Google Ads is changed.' });
  }

  // Other configured providers: foundation-only (live connect enabled in a later phase).
  return NextResponse.json({ ok: true, ready: true, connectEnabled: false, provider, scopes: def.scopes,
    message: 'Environment is configured and the token vault is ready. Live connect for this provider is enabled in a later phase. No provider API is called yet.' });
}
