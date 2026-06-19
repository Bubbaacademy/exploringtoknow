import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceLandingPage, landingSlugTaken, relationInWorkspace } from '@/lib/landing';
import { LP_PAGE_TYPES, slugify, isSafeHttpUrl, normalizeSections } from '@/lib/landing-constants';

/**
 * Update / status-transition / delete a workspace landing page. canWrite, and the
 * page is re-verified to belong to the actor's workspace (no cross-tenant access).
 * Publishing is an EXPLICIT action (POST {action:'publish'}) — never automatic.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
type Ctx = { params: Promise<{ id: string }> };

async function guard(idStr: string) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return { err: NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 }) };
  if (!canWrite(ws.role)) return { err: NextResponse.json({ ok: false, error: 'You don’t have permission to edit landing pages.' }, { status: 403 }) };
  const existing = await getWorkspaceLandingPage(ws.scope, idStr);
  if (!existing) return { err: NextResponse.json({ ok: false, error: 'Landing page not found.' }, { status: 404 }) };
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

  if (typeof body.title === 'string') { const t = str(body.title, 200); if (!t) return NextResponse.json({ ok: false, error: 'Title cannot be empty.' }, { status: 422 }); data.title = t; }
  if (typeof body.slug === 'string') {
    const s = slugify(body.slug) || 'page';
    if (await landingSlugTaken(ws!.scope, s, id)) return NextResponse.json({ ok: false, error: 'That slug is already used in this workspace.' }, { status: 409 });
    data.slug = s;
  }
  if (typeof body.pageType === 'string' && (LP_PAGE_TYPES as readonly string[]).includes(body.pageType)) data.pageType = body.pageType;
  if (typeof body.ctaUrl === 'string') {
    const u = str(body.ctaUrl, 500);
    if (u && !isSafeHttpUrl(u)) return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });
    data.ctaUrl = u || null;
  }
  for (const [k, max] of [['headline', 300], ['subheadline', 500], ['body', 20000], ['ctaLabel', 120], ['disclosureText', 2000], ['seoTitle', 200], ['seoDescription', 500]] as const) {
    if (typeof body[k] === 'string') data[k] = str(body[k], max) || null;
  }
  if (typeof body.noindex === 'boolean') data.noindex = body.noindex;
  if ('sections' in body) data.sections = normalizeSections(body.sections);
  // Related product/request: accept null to clear, or a value that belongs to this workspace.
  if ('relatedProduct' in body) data.relatedProduct = (body.relatedProduct && await relationInWorkspace(ws!.scope, 'products', body.relatedProduct)) ? body.relatedProduct : null;
  if ('relatedRequest' in body) data.relatedRequest = (body.relatedRequest && await relationInWorkspace(ws!.scope, 'product-requests', body.relatedRequest)) ? body.relatedRequest : null;

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'landing-pages', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}

const ACTIONS: Record<string, { status: string; setPublishedAt?: boolean }> = {
  publish: { status: 'published', setPublishedAt: true },
  unpublish: { status: 'draft' },
  ready: { status: 'ready_for_review' },
  draft: { status: 'draft' },
  archive: { status: 'archived' },
};

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const g = await guard(id);
  if ('err' in g) return g.err;
  const { ws, existing } = g;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const action = ACTIONS[String(body.action)];
  if (!action) return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 422 });

  // Guard: publishing requires a title + slug.
  if (action.status === 'published' && (!existing!.title || !existing!.slug)) {
    return NextResponse.json({ ok: false, error: 'Add a title and slug before publishing.' }, { status: 422 });
  }

  const data: Record<string, unknown> = { status: action.status, updatedBy: ws!.ctx.user!.id };
  if (action.setPublishedAt && !existing!.publishedAt) data.publishedAt = new Date().toISOString();

  try {
    const payload = await getPayload({ config });
    await payload.update({ collection: 'landing-pages', id: id as never, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, id, status: action.status });
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
    await payload.delete({ collection: 'landing-pages', id: id as never, overrideAccess: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not delete. Please try again.' }, { status: 500 });
  }
}
