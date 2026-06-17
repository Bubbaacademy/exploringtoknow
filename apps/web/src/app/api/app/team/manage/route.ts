import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageTeam } from '@/lib/roles';

/**
 * Owner-only member management: change role, remove member, revoke pending invite.
 * Every target is re-checked to belong to the actor's workspace (no cross-tenant
 * tampering). The last workspace_owner can never be demoted or removed. The
 * platform_super_admin role can never be assigned here.
 */
const ASSIGNABLE = ['workspace_owner', 'workspace_admin', 'editor', 'viewer'];
const refId = (v: unknown) => (v == null ? null : typeof v === 'object' ? (v as { id?: unknown }).id : v);

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.workspaceId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageTeam(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner can manage the team.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const action = typeof body.action === 'string' ? body.action : '';
  const payload = await getPayload({ config });

  try {
    if (action === 'role' || action === 'remove') {
      const id = body.membershipId;
      let m: Record<string, any> | null = null;
      try { m = (await payload.findByID({ collection: 'memberships', id: id as never, depth: 0, overrideAccess: true })) as Record<string, any>; } catch { m = null; }
      // Scope/tamper check — target must be in THIS workspace.
      if (!m || String(refId(m.workspace)) !== String(ws.scope.workspaceId)) {
        return NextResponse.json({ ok: false, error: 'Member not found in this workspace.' }, { status: 404 });
      }
      const ownerCount = (await payload.count({ collection: 'memberships', where: { and: [{ workspace: { equals: ws.scope.workspaceId } }, { role: { equals: 'workspace_owner' } }] } })).totalDocs;
      const targetIsOwner = m.role === 'workspace_owner';

      if (action === 'role') {
        const role = typeof body.role === 'string' ? body.role : '';
        if (!ASSIGNABLE.includes(role)) return NextResponse.json({ ok: false, error: 'Invalid role.' }, { status: 422 });
        if (targetIsOwner && role !== 'workspace_owner' && ownerCount <= 1) {
          return NextResponse.json({ ok: false, error: 'You can’t demote the last owner. Promote another owner first.' }, { status: 400 });
        }
        await payload.update({ collection: 'memberships', id: m.id, overrideAccess: true, data: { role: role as never } });
        return NextResponse.json({ ok: true });
      }
      // remove
      if (targetIsOwner && ownerCount <= 1) {
        return NextResponse.json({ ok: false, error: 'You can’t remove the last owner of the workspace.' }, { status: 400 });
      }
      await payload.delete({ collection: 'memberships', id: m.id, overrideAccess: true });
      return NextResponse.json({ ok: true });
    }

    if (action === 'revoke') {
      const id = body.invitationId;
      let inv: Record<string, any> | null = null;
      try { inv = (await payload.findByID({ collection: 'workspace-invitations', id: id as never, depth: 0, overrideAccess: true })) as Record<string, any>; } catch { inv = null; }
      if (!inv || String(refId(inv.workspace)) !== String(ws.scope.workspaceId)) {
        return NextResponse.json({ ok: false, error: 'Invitation not found in this workspace.' }, { status: 404 });
      }
      await payload.update({ collection: 'workspace-invitations', id: inv.id, overrideAccess: true, data: { status: 'revoked' } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Action failed. Please try again.' }, { status: 500 });
  }
}
