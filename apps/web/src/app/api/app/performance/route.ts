import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { relationInWorkspace } from '@/lib/performance';
import { PERF_PLATFORMS, PERF_CHANNEL_TYPES, coerceNumber } from '@/lib/performance-constants';

/**
 * Create a MANUAL performance entry (Phase 28). canWrite. Tenant/workspace + createdBy
 * server-derived. Numbers are coerced to non-negative — stored verbatim, never synced
 * or invented. Related refs accepted ONLY if they belong to the actor's workspace.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDate = (s: string) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to record performance.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const entryDate = str(body.entryDate, 10);
  const entryDateEnd = str(body.entryDateEnd, 10);
  if (!isDate(entryDate) || !isDate(entryDateEnd)) return NextResponse.json({ ok: false, error: 'Dates must be YYYY-MM-DD.' }, { status: 422 });

  const platform = (PERF_PLATFORMS as readonly string[]).includes(String(body.platform)) ? String(body.platform) : 'generic';
  const channelType = (PERF_CHANNEL_TYPES as readonly string[]).includes(String(body.channelType)) ? String(body.channelType) : 'generic';
  const status = body.status === 'draft' ? 'draft' : 'recorded';

  const rel = async (c: Parameters<typeof relationInWorkspace>[1], v: unknown) => ((await relationInWorkspace(ws.scope, c, v)) ? v : undefined);
  const [relatedAdCampaign, relatedAdCreative, relatedLandingPage, relatedSocialPost, relatedProduct, relatedRequest, relatedArticle] = await Promise.all([
    rel('ad-campaigns', body.relatedAdCampaign), rel('ad-creatives', body.relatedAdCreative), rel('landing-pages', body.relatedLandingPage),
    rel('social-studio-posts', body.relatedSocialPost), rel('products', body.relatedProduct), rel('product-requests', body.relatedRequest), rel('articles', body.relatedArticle),
  ]);

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'performance-entries', overrideAccess: true,
      data: {
        sourceType: 'manual_entry', platform, channelType, status,
        entryDate: entryDate || undefined, entryDateEnd: entryDateEnd || undefined,
        campaignName: str(body.campaignName, 300) || undefined, adSetName: str(body.adSetName, 300) || undefined, creativeName: str(body.creativeName, 300) || undefined,
        impressions: coerceNumber(body.impressions), clicks: coerceNumber(body.clicks), spend: coerceNumber(body.spend),
        conversions: coerceNumber(body.conversions), orders: coerceNumber(body.orders), revenue: coerceNumber(body.revenue),
        leads: coerceNumber(body.leads), addToCart: coerceNumber(body.addToCart),
        currency: str(body.currency, 8) || 'USD', notes: str(body.notes, 4000) || undefined,
        relatedAdCampaign: relatedAdCampaign as never, relatedAdCreative: relatedAdCreative as never, relatedLandingPage: relatedLandingPage as never,
        relatedSocialPost: relatedSocialPost as never, relatedProduct: relatedProduct as never, relatedRequest: relatedRequest as never, relatedArticle: relatedArticle as never,
        createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save the entry. Please try again.' }, { status: 500 });
  }
}
