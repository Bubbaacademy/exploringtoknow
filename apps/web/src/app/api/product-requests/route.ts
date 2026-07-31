import { NextResponse } from 'next/server';

/**
 * RETIRED (Phase 2Y — route/ownership boundary).
 *
 * This was the PUBLIC, unauthenticated product-request intake on the
 * ExploringToKnow magazine: it created `product-requests` rows straight from an
 * anonymous POST. Seller/product intake is BubbaAffiliate's, not the magazine's,
 * so the write path is closed rather than left reachable behind an unlinked URL.
 *
 * The endpoint is kept as an explicit 410 Gone (not deleted) so an old client or
 * bookmarked form gets a truthful "this is permanently gone" answer instead of a
 * generic 404 that reads like a routing mistake.
 *
 * UNAFFECTED — the operator path is a completely separate chain and still writes:
 *   page   /app/product-requests/new      (auth-gated, requireWorkspace + canWrite)
 *   upload POST /api/app/upload
 *   submit POST /api/app/product-requests
 * Approval, generation, the publish gate and the gated publisher are untouched.
 */
const GONE = {
  ok: false,
  error:
    'This intake has moved. Product and seller submissions are handled by BubbaAffiliate at https://bubbaaffiliate.com/sellers.',
} as const;

export async function POST() {
  return NextResponse.json(GONE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
