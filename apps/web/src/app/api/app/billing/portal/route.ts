import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageSettings } from '@/lib/roles';
import { billingLive } from '@/lib/billing';

/**
 * Open the Stripe billing portal. Owner-only. Local-safe: disabled response when
 * billing isn't configured or there's no customer yet.
 */
export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageSettings(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner can manage billing.' }, { status: 403 });
  }
  if (!billingLive()) {
    return NextResponse.json({ ok: false, disabled: true, error: 'Billing isn’t active yet.' }, { status: 200 });
  }
  const customerId = ws.tenant?.billingCustomerId ? String(ws.tenant.billingCustomerId) : '';
  if (!customerId) {
    return NextResponse.json({ ok: false, disabled: true, error: 'No billing account yet — start a plan first.' }, { status: 200 });
  }
  try {
    const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || new URL(req.url).origin;
    const params = new URLSearchParams({ customer: customerId, return_url: process.env.STRIPE_BILLING_PORTAL_RETURN_URL || `${base}/app/billing` });
    const r = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return NextResponse.json({ ok: false, error: 'Could not open the billing portal.' }, { status: 502 });
    return NextResponse.json({ ok: true, url: j.url });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not open the billing portal.' }, { status: 502 });
  }
}
