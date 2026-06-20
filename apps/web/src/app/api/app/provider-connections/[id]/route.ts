import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection } from '@/lib/providers';

/** Delete a provider connection record (Phase 30). Owner/admin + workspace-scoped. */
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can manage provider connections.' }, { status: 403 });
  const existing = await getWorkspaceConnection(ws.scope, id);
  if (!existing) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });
  try {
    const payload = await getPayload({ config });
    // Remove this connection's sync-run rows first (scoped), then the connection.
    await payload.delete({ collection: 'provider-sync-runs', overrideAccess: true, where: { and: [{ connection: { equals: id as never } }, { workspace: { equals: ws.scope.workspaceId as never } }] } });
    await payload.delete({ collection: 'provider-connections', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not remove the connection. Please try again.' }, { status: 500 });
  }
}
