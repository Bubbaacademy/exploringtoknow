import { NextResponse } from 'next/server';

/**
 * Tracking-link redirector slot: /go/<code>.
 * Phase 2 (Tracking) resolves <code> -> destination, logs a click_event, and
 * 302s. Phase 0 reserves the route only. NOTE: tracking redirect logic is NOT
 * orchestrated by LangGraph (it is plain request handling).
 */
export function GET() {
  return NextResponse.json(
    { error: 'not_implemented', phase: 'Tracking lands in Phase 2' },
    { status: 501 },
  );
}
