import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Public manual product-request intake. Server-side validated, honeypot-guarded.
 * Creates a `product-requests` doc with status `submitted` via the Payload Local
 * API (overrideAccess) — NEVER approves or enqueues generation. Approval is a
 * separate, explicit admin action.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot — silently accept (pretend success) so bots get no signal.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const get = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');
  const requesterName = get('requesterName');
  const requesterEmail = get('requesterEmail');
  const productName = get('productName');
  const productUrl = get('productUrl');
  const brand = get('brand');
  const affiliateUrl = get('affiliateUrl');
  const notes = get('notes');
  const requestedCategory = get('requestedCategory');
  const suggestedCategory = get('suggestedCategory');

  // Manually-uploaded image ids (from /api/product-request-upload). Min 3, max 30.
  const imageIds: number[] = Array.isArray((body as any).imageIds)
    ? ((body as any).imageIds as unknown[]).map((v) => Number(v)).filter((n) => Number.isFinite(n))
    : [];
  const permission = (body as any).imagePermissionConfirmed === true;

  const errors: string[] = [];
  if (requesterName.length < 2) errors.push('name');
  if (!isEmail(requesterEmail)) errors.push('email');
  if (productName.length < 2) errors.push('product name');
  if (!isUrl(productUrl)) errors.push('product URL');
  if (affiliateUrl && !isUrl(affiliateUrl)) errors.push('affiliate URL');
  if (!requestedCategory) errors.push('category');
  if (imageIds.length < 3) errors.push('at least 3 images');
  if (imageIds.length > 30) errors.push('at most 30 images');
  if (imageIds.length >= 3 && !permission) errors.push('image permission confirmation');
  if (errors.length) {
    return NextResponse.json({ ok: false, error: `Please check: ${errors.join(', ')}.` }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });

    // The category must be an EXISTING, ACTIVE category (public users never create
    // categories). When "Other / Not Sure" is chosen, a free-text suggestion is
    // required and stored on the request — it never auto-creates a category.
    const catId = Number(requestedCategory) || requestedCategory;
    let category: any = null;
    try { category = await payload.findByID({ collection: 'categories', id: catId as any, depth: 0 }); } catch { category = null; }
    if (!category || category.active === false) {
      return NextResponse.json({ ok: false, error: 'Please select a valid product category.' }, { status: 422 });
    }
    if (category.slug === 'other-not-sure' && suggestedCategory.length < 2) {
      return NextResponse.json({ ok: false, error: 'Please describe your suggested category.' }, { status: 422 });
    }

    const doc = await payload.create({
      collection: 'product-requests',
      data: {
        requesterName,
        requesterEmail,
        productName,
        brand: brand || undefined,
        productUrl,
        affiliateUrl: affiliateUrl || undefined,
        notes: notes || undefined,
        requestedCategory: catId,
        suggestedCategory: suggestedCategory || undefined,
        status: 'submitted',
        imagePermissionConfirmed: permission,
        productImages: imageIds.map((id, i) => ({ image: id, role: 'other', order: i, enabled: true, preferredHero: false })),
      },
    });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}
