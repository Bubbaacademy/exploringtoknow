import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageConnections } from '@/lib/roles';
import { connectionForProvider, providerSetup, sanitizeConnection } from '@/lib/providers';
import { PROVIDER_BY_ID, isProviderId } from '@/lib/provider-constants';

/**
 * Initialize a provider connection record (Phase 30 foundation). Owner/admin only.
 * Creates a tenant/workspace-scoped row with NO tokens — status reflects env readiness
 * (`disabled` coming-soon / `not_configured` / `ready_to_connect`). NO provider API is
 * called and NO token is stored here. Idempotent per provider (returns the existing row).
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canManageConnections(ws.role)) return NextResponse.json({ ok: false, error: 'Only an owner or admin can manage provider connections.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  if (!isProviderId(body.provider)) return NextResponse.json({ ok: false, error: 'Unknown provider.' }, { status: 422 });
  const def = PROVIDER_BY_ID[body.provider]!;
  if (def.comingSoon) return NextResponse.json({ ok: false, error: 'This provider is not available to connect yet.' }, { status: 422 });

  const setup = providerSetup(def);
  const existing = await connectionForProvider(ws.scope, def.id);
  if (existing) return NextResponse.json({ ok: true, id: existing.id, status: existing.status, alreadyExists: true });

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'provider-connections', overrideAccess: true,
      data: {
        provider: def.id, connectionType: 'oauth', status: setup.setupStatus,
        displayName: str(body.displayName, 200) || def.displayName,
        scopes: def.scopes,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id, status: setup.setupStatus, connection: sanitizeConnection(doc as never) });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not initialize the connection. Please try again.' }, { status: 500 });
  }
}
