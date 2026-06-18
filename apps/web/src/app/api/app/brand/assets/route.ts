import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageBrand } from '@/lib/roles';
import { ASSET_TYPES, ASSET_PERMISSIONS } from '@/lib/brandkit';

/**
 * Brand asset metadata entries (Phase 22 foundation — no binary upload). Owner/admin
 * only. Tenant/workspace derived from the session. DELETE re-verifies the asset
 * belongs to the actor's workspace before removing (no cross-tenant deletes).
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageBrand(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner or an admin can manage assets.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const label = str(body.label, 200);
  if (!label) return NextResponse.json({ ok: false, error: 'Give the asset a label.' }, { status: 422 });
  const assetType = (ASSET_TYPES as readonly string[]).includes(String(body.assetType)) ? String(body.assetType) : 'other';
  const permission = (ASSET_PERMISSIONS as readonly string[]).includes(String(body.permission)) ? String(body.permission) : 'needs_review';
  const sourceUrl = str(body.sourceUrl, 500);
  const notes = str(body.notes, 2000);

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'brand-assets', overrideAccess: true,
      data: { label, assetType, permission, sourceUrl: sourceUrl || undefined, notes: notes || undefined, tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not add the asset. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageBrand(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner or an admin can manage assets.' }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const id = body.id;
  if (id == null) return NextResponse.json({ ok: false, error: 'Missing asset id.' }, { status: 422 });

  try {
    const payload = await getPayload({ config });
    // Re-verify ownership within the actor's workspace before deleting.
    const found = await payload.find({
      collection: 'brand-assets', limit: 1, depth: 0, overrideAccess: true,
      where: { and: [{ id: { equals: id as never } }, { tenant: { equals: ws.scope.tenantId } }, { workspace: { equals: ws.scope.workspaceId } }] },
    });
    if (!found.docs.length) return NextResponse.json({ ok: false, error: 'Asset not found.' }, { status: 404 });
    await payload.delete({ collection: 'brand-assets', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not remove the asset. Please try again.' }, { status: 500 });
  }
}
