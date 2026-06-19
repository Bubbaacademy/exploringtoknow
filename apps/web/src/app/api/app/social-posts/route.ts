import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { relationInWorkspace } from '@/lib/social';
import { SS_CHANNELS, SS_FORMATS, isSafeHttpUrl, normalizeHashtags } from '@/lib/social-constants';

/**
 * Create a workspace Social Studio post (draft). canWrite (owner/admin/editor).
 * Tenant/workspace + createdBy are server-derived (client ids never trusted). CTA URL
 * must be http(s). Related product/request/landing-page/brand-profile are accepted
 * ONLY if they belong to the actor's workspace. NEVER publishes / schedules / calls a
 * platform API — new posts are always draft.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canWrite(ws.role)) {
    return NextResponse.json({ ok: false, error: 'You don’t have permission to create social posts.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const name = str(body.name, 200);
  if (!name) return NextResponse.json({ ok: false, error: 'Give the social post an internal name.' }, { status: 422 });

  const ctaUrl = str(body.ctaUrl, 500);
  if (ctaUrl && !isSafeHttpUrl(ctaUrl)) {
    return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });
  }
  const channel = (SS_CHANNELS as readonly string[]).includes(String(body.channel)) ? String(body.channel) : 'generic';
  const format = (SS_FORMATS as readonly string[]).includes(String(body.format)) ? String(body.format) : 'text';
  const hashtags = normalizeHashtags(body.hashtags);

  // Related refs — only if they belong to this workspace (no cross-tenant refs).
  const relatedProduct = (await relationInWorkspace(ws.scope, 'products', body.relatedProduct)) ? body.relatedProduct : undefined;
  const relatedRequest = (await relationInWorkspace(ws.scope, 'product-requests', body.relatedRequest)) ? body.relatedRequest : undefined;
  const relatedLandingPage = (await relationInWorkspace(ws.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : undefined;
  const relatedBrandProfile = (await relationInWorkspace(ws.scope, 'brand-profiles', body.relatedBrandProfile)) ? body.relatedBrandProfile : undefined;

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'social-studio-posts', overrideAccess: true,
      data: {
        name, channel, format, status: 'draft',
        hook: str(body.hook, 1000) || undefined,
        caption: str(body.caption, 8000) || undefined,
        hashtags: hashtags.length ? hashtags : undefined,
        ctaLabel: str(body.ctaLabel, 120) || undefined,
        ctaUrl: ctaUrl || undefined,
        disclosureText: str(body.disclosureText, 2000) || undefined,
        platformNotes: str(body.platformNotes, 2000) || undefined,
        notes: str(body.notes, 4000) || undefined,
        relatedProduct: relatedProduct as never, relatedRequest: relatedRequest as never,
        relatedLandingPage: relatedLandingPage as never, relatedBrandProfile: relatedBrandProfile as never,
        copyCount: 0,
        createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the social post. Please try again.' }, { status: 500 });
  }
}
