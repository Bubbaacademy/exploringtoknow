import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { relationInWorkspace } from '@/lib/ads';
import { AD_PLATFORMS, AD_OBJECTIVES, isSafeHttpUrl } from '@/lib/ads-constants';

/**
 * Create an ad campaign DRAFT (Phase 27). canWrite (owner/admin/editor). Tenant/
 * workspace + createdBy server-derived. Destination URL must be http(s). Related
 * product/request/landing-page/social-post/brand-profile accepted ONLY if in the
 * actor's workspace. NEVER launches/spends/connects an account — always draft.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to create ad campaigns.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const name = str(body.name, 200);
  if (!name) return NextResponse.json({ ok: false, error: 'Give the campaign a name.' }, { status: 422 });

  const destinationURL = str(body.destinationURL, 1000);
  if (destinationURL && !isSafeHttpUrl(destinationURL)) return NextResponse.json({ ok: false, error: 'Destination URL must start with http:// or https://.' }, { status: 422 });

  const platform = (AD_PLATFORMS as readonly string[]).includes(String(body.platform)) ? String(body.platform) : 'generic';
  const objective = (AD_OBJECTIVES as readonly string[]).includes(String(body.objective)) ? String(body.objective) : 'generic';

  const relatedProduct = (await relationInWorkspace(ws.scope, 'products', body.relatedProduct)) ? body.relatedProduct : undefined;
  const relatedRequest = (await relationInWorkspace(ws.scope, 'product-requests', body.relatedRequest)) ? body.relatedRequest : undefined;
  const relatedLandingPage = (await relationInWorkspace(ws.scope, 'landing-pages', body.relatedLandingPage)) ? body.relatedLandingPage : undefined;
  const relatedSocialPost = (await relationInWorkspace(ws.scope, 'social-studio-posts', body.relatedSocialPost)) ? body.relatedSocialPost : undefined;
  const relatedBrandProfile = (await relationInWorkspace(ws.scope, 'brand-profiles', body.relatedBrandProfile)) ? body.relatedBrandProfile : undefined;

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'ad-campaigns', overrideAccess: true,
      data: {
        name, platform, objective, status: 'draft',
        audienceName: str(body.audienceName, 200) || undefined,
        audienceNotes: str(body.audienceNotes, 4000) || undefined,
        geographyNotes: str(body.geographyNotes, 2000) || undefined,
        languageNotes: str(body.languageNotes, 500) || undefined,
        placementNotes: str(body.placementNotes, 2000) || undefined,
        budgetNotes: str(body.budgetNotes, 2000) || undefined,
        scheduleNotes: str(body.scheduleNotes, 2000) || undefined,
        primaryCTA: str(body.primaryCTA, 120) || undefined,
        destinationURL: destinationURL || undefined,
        utmSource: str(body.utmSource, 200) || undefined, utmMedium: str(body.utmMedium, 200) || undefined,
        utmCampaign: str(body.utmCampaign, 200) || undefined, utmContent: str(body.utmContent, 200) || undefined,
        utmTerm: str(body.utmTerm, 200) || undefined,
        disclosureText: str(body.disclosureText, 2000) || undefined,
        notes: str(body.notes, 4000) || undefined,
        relatedProduct: relatedProduct as never, relatedRequest: relatedRequest as never,
        relatedLandingPage: relatedLandingPage as never, relatedSocialPost: relatedSocialPost as never,
        relatedBrandProfile: relatedBrandProfile as never,
        exportCount: 0,
        createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the campaign. Please try again.' }, { status: 500 });
  }
}
