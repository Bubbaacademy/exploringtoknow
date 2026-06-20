import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceEntry, relationInWorkspace } from '@/lib/performance';
import { PERF_PLATFORMS, PERF_CHANNEL_TYPES, coerceNumber } from '@/lib/performance-constants';

/** Update / status / delete a manual performance entry (Phase 28). canWrite + scoped. */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDate = (s: string) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s);
type Ctx = { params: Promise<{ id: string }> };

async function guard(idStr: string) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return { err: NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 }) };
  if (!canWrite(ws.role)) return { err: NextResponse.json({ ok: false, error: 'You don’t have permission to edit performance.' }, { status: 403 }) };
  const existing = await getWorkspaceEntry(ws.scope, idStr);
  if (!existing) return { err: NextResponse.json({ ok: false, error: 'Entry not found.' }, { status: 404 }) };
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

  if (typeof body.platform === 'string' && (PERF_PLATFORMS as readonly string[]).includes(body.platform)) data.platform = body.platform;
  if (typeof body.channelType === 'string' && (PERF_CHANNEL_TYPES as readonly string[]).includes(body.channelType)) data.channelType = body.channelType;
  for (const k of ['entryDate', 'entryDateEnd'] as const) {
    if (typeof body[k] === 'string') { const d = str(body[k], 10); if (!isDate(d)) return NextResponse.json({ ok: false, error: 'Dates must be YYYY-MM-DD.' }, { status: 422 }); data[k] = d || null; }
  }
  for (const [k, max] of [['campaignName', 300], ['adSetName', 300], ['creativeName', 300], ['currency', 8], ['notes', 4000]] as const) {
    if (typeof body[k] === 'string') data[k] = str(body[k], max) || (k === 'currency' ? 'USD' : null);
  }
  for (const k of ['impressions', 'clicks', 'spend', 'conversions', 'orders', 'revenue', 'leads', 'addToCart'] as const) {
    if (k in body) data[k] = coerceNumber(body[k]);
  }
  const relMap: Array<[string, Parameters<typeof relationInWorkspace>[1]]> = [
    ['relatedAdCampaign', 'ad-campaigns'], ['relatedAdCreative', 'ad-creatives'], ['relatedLandingPage', 'landing-pages'],
    ['relatedSocialPost', 'social-studio-posts'], ['relatedProduct', 'products'], ['relatedRequest', 'product-requests'], ['relatedArticle', 'articles'],
  ];
  for (const [field, coll] of relMap) {
    if (field in body) data[field] = (body[field] && await relationInWorkspace(ws!.scope, coll, body[field])) ? body[field] : null;
  }

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'performance-entries', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}

const ACTIONS: Record<string, string> = { record: 'recorded', draft: 'draft', archive: 'archived' };

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
    await payload.update({ collection: 'performance-entries', id: id as never, overrideAccess: true, data: { status, updatedBy: ws!.ctx.user!.id } as never });
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
    await payload.delete({ collection: 'performance-entries', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not delete. Please try again.' }, { status: 500 });
  }
}
