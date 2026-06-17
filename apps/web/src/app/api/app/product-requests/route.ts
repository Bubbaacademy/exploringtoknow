import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';

/**
 * Workspace-scoped product-request creation. Requires a valid workspace session;
 * the request is stamped with the ACTOR's tenant/workspace (server-derived). Status
 * is always `submitted` — this NEVER approves or enqueues generation (approval is a
 * separate, explicit editorial action). Category is validated server-side.
 */
const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }

  // Honeypot — pretend success so bots get no signal.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true, redirect: '/app/product-requests' });
  }

  const get = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');
  const productName = get('productName');
  const brand = get('brand');
  const productUrl = get('productUrl');
  const notes = get('notes');
  const requestedCategory = get('requestedCategory');
  const suggestedCategory = get('suggestedCategory');
  const imageIds: number[] = Array.isArray((body as { imageIds?: unknown[] }).imageIds)
    ? ((body as { imageIds: unknown[] }).imageIds).map((v) => Number(v)).filter((n) => Number.isFinite(n))
    : [];
  const permission = (body as { imagePermissionConfirmed?: unknown }).imagePermissionConfirmed === true;

  const errors: string[] = [];
  if (productName.length < 2) errors.push('product name');
  if (!isUrl(productUrl)) errors.push('product URL (https://…)');
  if (!requestedCategory) errors.push('category');
  if (imageIds.length < 1) errors.push('at least 1 image');
  if (imageIds.length > 30) errors.push('at most 30 images');
  if (imageIds.length >= 1 && !permission) errors.push('image permission confirmation');
  if (errors.length) {
    return NextResponse.json({ ok: false, error: `Please check: ${errors.join(', ')}.` }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });

    // Category must be an EXISTING, ACTIVE category (validated server-side; never trusted blindly).
    const catId = Number(requestedCategory) || requestedCategory;
    let category: { active?: boolean; slug?: string } | null = null;
    try { category = (await payload.findByID({ collection: 'categories', id: catId as never, depth: 0 })) as { active?: boolean; slug?: string }; } catch { category = null; }
    if (!category || category.active === false) {
      return NextResponse.json({ ok: false, error: 'Please select a valid product category.' }, { status: 422 });
    }
    if (category.slug === 'other-not-sure' && suggestedCategory.length < 2) {
      return NextResponse.json({ ok: false, error: 'Please describe your suggested category.' }, { status: 422 });
    }

    const doc = await payload.create({
      collection: 'product-requests',
      overrideAccess: true,
      data: {
        requesterName: (ws.tenant?.name as string) || (ws.ctx.user.name as string) || 'Workspace owner',
        requesterEmail: (ws.ctx.user.email as string) || 'unknown@workspace',
        productName,
        brand: brand || undefined,
        productUrl,
        notes: notes || undefined,
        requestedCategory: catId as never,
        suggestedCategory: suggestedCategory || undefined,
        status: 'submitted',
        imagePermissionConfirmed: permission,
        productImages: imageIds.map((id, i) => ({ image: id as never, role: 'other', order: i, enabled: true, preferredHero: false })),
        // Server-derived scope — client-submitted tenant/workspace ids are never used.
        tenant: ws.scope.tenantId as never,
        workspace: ws.scope.workspaceId as never,
      },
    });
    return NextResponse.json({ ok: true, id: doc.id, redirect: '/app/product-requests' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}
