import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceCampaign, relationInWorkspace } from '@/lib/ads';
import { AD_PLATFORMS, AD_OBJECTIVES, isSafeHttpUrl } from '@/lib/ads-constants';

/**
 * Update / status-transition / delete an ad campaign draft (Phase 27). canWrite, and
 * the campaign is re-verified to belong to the actor's workspace. "Approve to export"
 * is the furthest a campaign goes — NO launch, spend, account connection, or API call.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
type Ctx = { params: Promise<{ id: string }> };

async function guard(idStr: string) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return { err: NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 }) };
  if (!canWrite(ws.role)) return { err: NextResponse.json({ ok: false, error: 'You don’t have permission to edit ad campaigns.' }, { status: 403 }) };
  const existing = await getWorkspaceCampaign(ws.scope, idStr);
  if (!existing) return { err: NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 }) };
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
  if (typeof body.objective === 'string' && (AD_OBJECTIVES as readonly string[]).includes(body.objective)) data.objective = body.objective;
  if (typeof body.destinationURL === 'string') {
    const u = str(body.destinationURL, 1000);
    if (u && !isSafeHttpUrl(u)) return NextResponse.json({ ok: false, error: 'Destination URL must start with http:// or https://.' }, { status: 422 });
    data.destinationURL = u || null;
  }
  for (const [k, max] of [['audienceName', 200], ['audienceNotes', 4000], ['geographyNotes', 2000], ['languageNotes', 500], ['placementNotes', 2000], ['budgetNotes', 2000], ['scheduleNotes', 2000], ['primaryCTA', 120], ['utmSource', 200], ['utmMedium', 200], ['utmCampaign', 200], ['utmContent', 200], ['utmTerm', 200], ['disclosureText', 2000], ['notes', 4000]] as const) {
    if (typeof body[k] === 'string') data[k] = str(body[k], max) || null;
  }
  if ('relatedProduct' in body) data.relatedProduct = (body.relatedProduct && await relationInWorkspace(ws!.scope, 'products', body.relatedProduct)) ? body.relatedProduct : null;
  if ('relatedRequest' in body) data.relatedRequest = (body.relatedRequest && await relationInWorkspace(ws!.scope, 'product-requests', body.relatedRequest)) ? body.relatedRequest : null;
  if ('relatedLandingPage' in body) data.relatedLandingPage = (body.relatedLandingPage && await relationInWorkspace(ws!.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : null;
  if ('relatedSocialPost' in body) data.relatedSocialPost = (body.relatedSocialPost && await relationInWorkspace(ws!.scope, 'social-studio-posts', body.relatedSocialPost)) ? body.relatedSocialPost : null;
  if ('relatedBrandProfile' in body) data.relatedBrandProfile = (body.relatedBrandProfile && await relationInWorkspace(ws!.scope, 'brand-profiles', body.relatedBrandProfile)) ? body.relatedBrandProfile : null;

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'ad-campaigns', id: id as never, overrideAccess: true, data: data as never });
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
  const { ws, existing } = g;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const status = ACTIONS[String(body.action)];
  if (!status) return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 422 });
  if (status === 'approved_to_export' && !existing!.name) return NextResponse.json({ ok: false, error: 'Add a name before approving.' }, { status: 422 });

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'ad-campaigns', id: id as never, overrideAccess: true, data: { status, updatedBy: ws!.ctx.user!.id } as never });
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
    // Remove the campaign's creatives first (they belong to it), then the campaign.
    await payload.delete({ collection: 'ad-creatives', overrideAccess: true, where: { and: [{ campaign: { equals: id as never } }, { workspace: { equals: g.ws!.scope.workspaceId as never } }] } });
    await payload.delete({ collection: 'ad-campaigns', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not delete. Please try again.' }, { status: 500 });
  }
}
