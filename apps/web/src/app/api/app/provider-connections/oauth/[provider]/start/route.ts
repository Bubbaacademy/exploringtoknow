import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { providerSetup } from '@/lib/providers';
import { PROVIDER_BY_ID, isProviderId } from '@/lib/provider-constants';

/**
 * OAuth START foundation (Phase 30). Owner/admin only. Evaluates env readiness (names
 * only) and returns a SAFE readiness response. It performs NO provider API call, NO
 * token exchange, and NO redirect — live connect is deliberately deferred to Phase 31
 * (Google Ads read sync first). If env is missing the response is `not_configured`.
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
      error: 'This provider is not configured. Set the required environment variables to enable connecting.' }, { status: 422 });
  }
  // Configured, but Phase 30 is foundation-only — the live OAuth handshake is enabled in Phase 31.
  return NextResponse.json({
    ok: true, ready: true, connectEnabled: false, provider: def.id, scopes: def.scopes,
    message: 'Environment is configured and the token vault is ready. The live OAuth connect is enabled in the provider read-sync phase (Google Ads first, Phase 31). No provider API is called yet.',
  });
}
