import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection } from '@/lib/providers';

/**
 * Disconnect a provider connection (Phase 30). Owner/admin + workspace-scoped. Clears
 * any stored encrypted tokens and marks the record disconnected. No provider API call.
 */
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can manage provider connections.' }, { status: 403 });
  const existing = await getWorkspaceConnection(ws.scope, id);
  if (!existing) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: 'provider-connections', id: id as never, overrideAccess: true,
      data: {
        status: 'disconnected',
        accessTokenEncrypted: null, refreshTokenEncrypted: null, tokenExpiresAt: null, tokenType: null,
        disconnectedAt: new Date().toISOString(), disconnectedBy: ws.ctx.user.id,
      } as never,
    });
    return NextResponse.json({ ok: true, id, status: 'disconnected' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not disconnect. Please try again.' }, { status: 500 });
  }
}
