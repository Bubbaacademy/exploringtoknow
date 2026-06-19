import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceSocialPost, relationInWorkspace } from '@/lib/social';
import { SS_CHANNELS, SS_FORMATS, isSafeHttpUrl, normalizeHashtags } from '@/lib/social-constants';

/**
 * Update / status-transition / record-copy / delete a workspace Social Studio post.
 * canWrite, and the post is re-verified to belong to the actor's workspace (no
 * cross-tenant access). Status changes are explicit actions; "approve to copy" is the
 * furthest a post goes — there is NO publish, schedule, or platform call anywhere.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
type Ctx = { params: Promise<{ id: string }> };

async function guard(_idStr: string) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return { err: NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 }) };
  if (!canWrite(ws.role)) return { err: NextResponse.json({ ok: false, error: 'You don’t have permission to edit social posts.' }, { status: 403 }) };
  const existing = await getWorkspaceSocialPost(ws.scope, _idStr);
  if (!existing) return { err: NextResponse.json({ ok: false, error: 'Social post not found.' }, { status: 404 }) };
  return { ws, existing };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ('err' in g) return g.err;
  const { ws } = g;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const data: Record<string, unknown> = { updatedBy: ws!.ctx.user!.id };

  if (typeof body.name === 'string') { const n = str(body.name, 200); if (!n) return NextResponse.json({ ok: false, error: 'Name cannot be empty.' }, { status: 422 }); data.name = n; }
  if (typeof body.channel === 'string' && (SS_CHANNELS as readonly string[]).includes(body.channel)) data.channel = body.channel;
  if (typeof body.format === 'string' && (SS_FORMATS as readonly string[]).includes(body.format)) data.format = body.format;
  if (typeof body.ctaUrl === 'string') {
    const u = str(body.ctaUrl, 500);
    if (u && !isSafeHttpUrl(u)) return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });
    data.ctaUrl = u || null;
  }
  for (const [k, max] of [['hook', 1000], ['caption', 8000], ['ctaLabel', 120], ['disclosureText', 2000], ['platformNotes', 2000], ['notes', 4000]] as const) {
    if (typeof body[k] === 'string') data[k] = str(body[k], max) || null;
  }
  if ('hashtags' in body) { const h = normalizeHashtags(body.hashtags); data.hashtags = h.length ? h : null; }
  // Related refs: accept null to clear, or a value that belongs to this workspace.
  if ('relatedProduct' in body) data.relatedProduct = (body.relatedProduct && await relationInWorkspace(ws!.scope, 'products', body.relatedProduct)) ? body.relatedProduct : null;
  if ('relatedRequest' in body) data.relatedRequest = (body.relatedRequest && await relationInWorkspace(ws!.scope, 'product-requests', body.relatedRequest)) ? body.relatedRequest : null;
  if ('relatedLandingPage' in body) data.relatedLandingPage = (body.relatedLandingPage && await relationInWorkspace(ws!.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : null;
  if ('relatedBrandProfile' in body) data.relatedBrandProfile = (body.relatedBrandProfile && await relationInWorkspace(ws!.scope, 'brand-profiles', body.relatedBrandProfile)) ? body.relatedBrandProfile : null;

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'social-studio-posts', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}

const ACTIONS: Record<string, string> = {
  ready: 'ready_for_review',
  approve: 'approved_to_copy',
  draft: 'draft',
  archive: 'archived',
};

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ('err' in g) return g.err;
  const { ws, existing } = g;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const action = String(body.action);

  // "copied" is a first-party usage counter (no external call) — records that the
  // composed text was copied to the clipboard. Allowed only once approved-to-copy.
  if (action === 'copied') {
    if (existing!.status !== 'approved_to_copy') {
      return NextResponse.json({ ok: false, error: 'Approve the post to copy first.' }, { status: 422 });
    }
    const data: Record<string, unknown> = {
      copyCount: Number(existing!.copyCount || 0) + 1,
      copiedAt: new Date().toISOString(),
      updatedBy: ws!.ctx.user!.id,
    };
    try {
      const payload = await getPayload({ config });
      await payload.update({ collection: 'social-studio-posts', id: id as never, overrideAccess: true, data: data as never });
      return NextResponse.json({ ok: true, id, copyCount: data.copyCount });
    } catch {
      return NextResponse.json({ ok: false, error: 'Could not record the copy.' }, { status: 500 });
    }
  }

  const status = ACTIONS[action];
  if (!status) return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 422 });

  // Approving requires a name + some copy to actually be useful.
  if (status === 'approved_to_copy' && !existing!.name) {
    return NextResponse.json({ ok: false, error: 'Add a name before approving.' }, { status: 422 });
  }

  const data: Record<string, unknown> = { status, updatedBy: ws!.ctx.user!.id };
  if (status === 'approved_to_copy' && !existing!.approvedAt) data.approvedAt = new Date().toISOString();

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'social-studio-posts', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id, status });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not update status. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ('err' in g) return g.err;
  try {
    const payload = await getPayload({ config });
    await payload.delete({ collection: 'social-studio-posts', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not delete. Please try again.' }, { status: 500 });
  }
}
