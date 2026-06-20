import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { getWorkspaceConnection, listProviderAccounts } from '@/lib/providers';

/**
 * Select which discovered account this connection syncs (Phase 31). Owner/admin +
 * workspace-scoped. The chosen account must already belong to this workspace/connection.
 */
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can change the synced account.' }, { status: 403 });
  const connection = await getWorkspaceConnection(ws.scope, id);
  if (!connection) return NextResponse.json({ ok: false, error: 'Connection not found.' }, { status: 404 });

  let body: Record<string, unknown>; try { body = await req.json(); } catch { body = {}; }
  const wanted = String(body.providerAccountId ?? '').replace(/[^0-9]/g, '');
  if (!wanted) return NextResponse.json({ ok: false, error: 'Provide an account id.' }, { status: 422 });

  const accounts = await listProviderAccounts(ws.scope, id);
  const target = accounts.find((a) => String(a.providerAccountId) === wanted);
  if (!target) return NextResponse.json({ ok: false, error: 'That account is not in your workspace.' }, { status: 404 });

  try {
    const payload = await getPayload({ config });
    for (const a of accounts) {
      const shouldSelect = String(a.providerAccountId) === wanted;
      if (Boolean(a.selected) !== shouldSelect) await payload.update({ collection: 'provider-accounts', id: a.id as never, overrideAccess: true, data: { selected: shouldSelect } as never });
    }
    await payload.update({ collection: 'provider-connections', id: connection.id as never, overrideAccess: true, data: { providerAccountId: wanted } as never });
    return NextResponse.json({ ok: true, selected: wanted });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not change the account. Please try again.' }, { status: 500 });
  }
}
