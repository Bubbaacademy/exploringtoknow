import { NextResponse } from 'next/server';

/**
 * RETIRED (Phase 2Y — route/ownership boundary).
 *
 * This was the PUBLIC, unauthenticated image upload for the magazine's
 * product-request form: an anonymous POST created a `media` row AND wrote the
 * file to the persistent volume. It only ever served `/request-product`, which
 * is now retired, so leaving it open would have left the larger of the two
 * anonymous write paths reachable.
 *
 * Kept as an explicit 410 Gone for the same reason as `/api/product-requests`.
 *
 * UNAFFECTED — the operator upload path is separate and still works:
 *   POST /api/app/upload   (used by components/app/CreateProductForm.tsx)
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        'This upload endpoint has been retired. Product and seller submissions are handled by BubbaAffiliate at https://bubbaaffiliate.com/sellers.',
    },
    { status: 410 },
  );
}
