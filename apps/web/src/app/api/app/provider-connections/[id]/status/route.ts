import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { getWorkspaceConnection, sanitizeConnection } from '@/lib/providers';

/**
 * Read sanitized status of a provider connection (Phase 30). Any workspace member may
 * read status; token ciphertext is NEVER included (sanitizeConnection strips it).
 */
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  const existing = await getWorkspaceConnection(ws.scope, id);
  if (!existing) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  const s = sanitizeConnection(existing);
  return NextResponse.json({
    ok: true,
    connection: {
      id: s.id, provider: s.provider, status: s.status, displayName: s.displayName,
      providerAccountId: s.providerAccountId ?? null, providerAccountName: s.providerAccountName ?? null,
      hasStoredToken: s.hasStoredToken, tokenExpiresAt: s.tokenExpiresAt ?? null,
      lastConnectedAt: s.lastConnectedAt ?? null, lastSyncAt: s.lastSyncAt ?? null,
      lastErrorCode: s.lastErrorCode ?? null, lastErrorMessage: s.lastErrorMessage ?? null,
    },
  });
}
