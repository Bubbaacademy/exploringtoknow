import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { isProviderId } from '@/lib/provider-constants';
import { encryptionReady, verifyState } from '@/lib/provider-crypto';

/**
 * OAuth CALLBACK foundation (Phase 30). Validates the signed `state` (HMAC, vault-keyed)
 * and rejects missing/invalid/forged or cross-workspace state. It performs NO token
 * exchange and stores NO token in this phase — the live exchange is enabled in Phase 31.
 * State is server-signed and workspace-scoped; provider/workspace are never trusted from
 * the client beyond the signed state, which is re-checked against the session workspace.
 */
type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { provider } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!isProviderId(provider)) return NextResponse.json({ ok: false, error: 'Unknown provider.' }, { status: 422 });

  const url = new URL(req.url);
  const state = url.searchParams.get('state') || '';
  const providerError = url.searchParams.get('error');
  if (providerError) return NextResponse.json({ ok: false, code: 'provider_error', error: 'The provider returned an error during authorization.' }, { status: 400 });
  if (!state) return NextResponse.json({ ok: false, code: 'missing_state', error: 'Missing OAuth state.' }, { status: 400 });

  // Vault must be configured to have signed/verified state at all.
  if (!encryptionReady()) return NextResponse.json({ ok: false, code: 'not_configured', error: 'Provider connections are not configured.' }, { status: 422 });

  const decoded = verifyState(state);
  if (!decoded || decoded.provider !== provider) return NextResponse.json({ ok: false, code: 'invalid_state', error: 'Invalid OAuth state.' }, { status: 400 });
  if (String(decoded.workspaceId) !== String(ws.scope.workspaceId)) {
    return NextResponse.json({ ok: false, code: 'workspace_mismatch', error: 'OAuth state does not match this workspace.' }, { status: 403 });
  }

  // Foundation-only: do NOT exchange the code or store any token in Phase 30.
  return NextResponse.json({
    ok: true, exchanged: false, provider,
    message: 'OAuth state verified. Token exchange and storage are enabled in the provider read-sync phase (Phase 31). No token was exchanged or stored.',
  });
}
