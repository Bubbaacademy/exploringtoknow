import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceCreative, relationInWorkspace } from '@/lib/ads';
import { AD_PLATFORMS, AD_CREATIVE_FORMATS, isSafeHttpUrl } from '@/lib/ads-constants';

/**
 * Update / status-transition / delete an ad creative draft (Phase 27). canWrite, and
 * the creative is re-verified to belong to the actor's workspace. Manual only.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
type Ctx = { params: Promise<{ id: string }> };

async function guard(idStr: string) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return { err: NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 }) };
  if (!canWrite(ws.role)) return { err: NextResponse.json({ ok: false, error: 'You don’t have permission to edit ad creatives.' }, { status: 403 }) };
  const existing = await getWorkspaceCreative(ws.scope, idStr);
  if (!existing) return { err: NextResponse.json({ ok: false, error: 'Creative not found.' }, { status: 404 }) };
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
  if (typeof body.platform === 'string' && (AD_PLATFORMS as readonly string[]).includes(body.platform)) data.platform = body.platform;
  if (typeof body.format === 'string' && (AD_CREATIVE_FORMATS as readonly string[]).includes(body.format)) data.format = body.format;
  if (typeof body.ctaUrl === 'string') {
    const u = str(body.ctaUrl, 1000);
    if (u && !isSafeHttpUrl(u)) return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });
    data.ctaUrl = u || null;
  }
  for (const [k, max] of [['headline', 4000], ['primaryText', 8000], ['description', 4000], ['ctaLabel', 120], ['displayPath', 200], ['keywords', 4000], ['creativeNotes', 4000], ['disclosureText', 2000]] as const) {
    if (typeof body[k] === 'string') data[k] = str(body[k], max) || null;
  }
  if ('relatedSocialPost' in body) data.relatedSocialPost = (body.relatedSocialPost && await relationInWorkspace(ws!.scope, 'social-studio-posts', body.relatedSocialPost)) ? body.relatedSocialPost : null;
  if ('relatedLandingPage' in body) data.relatedLandingPage = (body.relatedLandingPage && await relationInWorkspace(ws!.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : null;

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'ad-creatives', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}

const ACTIONS: Record<string, string> = { ready: 'ready_for_review', approve: 'approved_to_export', draft: 'draft', archive: 'archived' };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ('err' in g) return g.err;
  const { ws } = g;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const status = ACTIONS[String(body.action)];
  if (!status) return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 422 });
  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'ad-creatives', id: id as never, overrideAccess: true, data: { status, updatedBy: ws!.ctx.user!.id } as never });
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
    await payload.delete({ collection: 'ad-creatives', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not delete. Please try again.' }, { status: 500 });
  }
}
