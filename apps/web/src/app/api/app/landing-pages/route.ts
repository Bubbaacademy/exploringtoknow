import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { landingSlugTaken } from '@/lib/landing';
import { LP_PAGE_TYPES, slugify, isSafeHttpUrl } from '@/lib/landing-constants';

/**
 * Create a workspace landing page (draft). canWrite (owner/admin/editor). Tenant/
 * workspace + createdBy are server-derived. Slug is unique within the workspace.
 * CTA URL must be http(s). NEVER publishes — new pages are always draft.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canWrite(ws.role)) {
    return NextResponse.json({ ok: false, error: 'You don’t have permission to create landing pages.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const title = str(body.title, 200);
  if (!title) return NextResponse.json({ ok: false, error: 'Give the landing page a title.' }, { status: 422 });

  const ctaUrl = str(body.ctaUrl, 500);
  if (ctaUrl && !isSafeHttpUrl(ctaUrl)) {
    return NextResponse.json({ ok: false, error: 'CTA URL must start with http:// or https://.' }, { status: 422 });
  }
  const pageType = (LP_PAGE_TYPES as readonly string[]).includes(String(body.pageType)) ? String(body.pageType) : 'general';

  // Unique slug within the workspace (derive from title if not supplied).
  let base = slugify(str(body.slug, 80) || title) || 'page';
  let slug = base;
  for (let i = 2; i <= 50 && (await landingSlugTaken(ws.scope, slug)); i++) slug = `${base}-${i}`;

  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: 'landing-pages', overrideAccess: true,
      data: {
        title, slug, status: 'draft', pageType,
        headline: str(body.headline, 300) || undefined,
        subheadline: str(body.subheadline, 500) || undefined,
        body: str(body.body, 20000) || undefined,
        ctaLabel: str(body.ctaLabel, 120) || undefined,
        ctaUrl: ctaUrl || undefined,
        disclosureText: str(body.disclosureText, 2000) || undefined,
        seoTitle: str(body.seoTitle, 200) || undefined,
        seoDescription: str(body.seoDescription, 500) || undefined,
        noindex: true,
        createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
        tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
      } as never,
    });
    return NextResponse.json({ ok: true, id: doc.id, slug });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the landing page. Please try again.' }, { status: 500 });
  }
}
