import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { relationInWorkspace } from '@/lib/ads';
import { AD_PLATFORMS, AD_CREATIVE_FORMATS, isSafeHttpUrl } from '@/lib/ads-constants';

/**
 * Create an ad creative DRAFT under a campaign (Phase 27). canWrite. The parent
 * campaign + any related social-post/landing-page must belong to the actor's
 * workspace. Manual authoring only — no AI, no asset upload, no API/launch.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to create ad creatives.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const name = str(body.name, 200);
  if (!name) return NextResponse.json({ ok: false, error: 'Give the creative a name.' }, { status: 422 });

  // Parent campaign must belong to this workspace.
  if (!(await relationInWorkspace(ws.scope, 'ad-campaigns', body.campaign))) {
    return NextResponse.json({ ok: false, error: 'Pick a campaign in your workspace.' }, { status: 422 });
  }
  const ctaUrl = str(body.ctaUrl, 1000);
  if (ctaUrl && !isSafeHttpUrl(ctaUrl)) return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });

  const platform = (AD_PLATFORMS as readonly string[]).includes(String(body.platform)) ? String(body.platform) : 'generic';
  const format = (AD_CREATIVE_FORMATS as readonly string[]).includes(String(body.format)) ? String(body.format) : 'text_ad';
  const relatedSocialPost = (await relationInWorkspace(ws.scope, 'social-studio-posts', body.relatedSocialPost)) ? body.relatedSocialPost : undefined;
  const relatedLandingPage = (await relationInWorkspace(ws.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : undefined;

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'ad-creatives', overrideAccess: true,
      data: {
        campaign: body.campaign as never, name, platform, format, status: 'draft',
        headline: str(body.headline, 4000) || undefined,
        primaryText: str(body.primaryText, 8000) || undefined,
        description: str(body.description, 4000) || undefined,
        ctaLabel: str(body.ctaLabel, 120) || undefined,
        ctaUrl: ctaUrl || undefined,
        displayPath: str(body.displayPath, 200) || undefined,
        keywords: str(body.keywords, 4000) || undefined,
        creativeNotes: str(body.creativeNotes, 4000) || undefined,
        disclosureText: str(body.disclosureText, 2000) || undefined,
        relatedSocialPost: relatedSocialPost as never, relatedLandingPage: relatedLandingPage as never,
        createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the creative. Please try again.' }, { status: 500 });
  }
}
