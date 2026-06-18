import { NextResponse } from 'next/server';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageSettings } from '@/lib/roles';
import { billingLive } from '@/lib/billing';
import { planFor } from '@/lib/plans';

/**
 * Start a subscription checkout. Owner-only. The price id comes from the
 * server-side plan config (the client only sends a plan key — never a raw price).
 * Local-safe: if billing isn't configured, returns a clear disabled response (200)
 * instead of failing. Uses Stripe's REST API directly (no SDK dependency).
 */
export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageSettings(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner can manage billing.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const plan = planFor(typeof body.plan === 'string' ? body.plan : '');
  if (!plan.selectable || !plan.priceEnvKey) {
    return NextResponse.json({ ok: false, error: 'Choose a valid plan to upgrade.' }, { status: 422 });
  }

  if (!billingLive()) {
    return NextResponse.json({ ok: false, disabled: true, error: 'Billing isn’t active yet — online checkout will be enabled soon. Contact us to upgrade in the meantime.' }, { status: 200 });
  }
  const priceId = process.env[plan.priceEnvKey];
  if (!priceId) {
    return NextResponse.json({ ok: false, disabled: true, error: 'This plan isn’t available for checkout yet.' }, { status: 200 });
  }

  try {
    const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || new URL(req.url).origin;
    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${base}/app/billing?checkout=success`,
      cancel_url: `${base}/app/billing?checkout=cancelled`,
      client_reference_id: String(ws.scope.tenantId),
    });
    const customerId = ws.tenant?.billingCustomerId ? String(ws.tenant.billingCustomerId) : '';
    if (customerId) params.set('customer', customerId);
    else if (ws.ctx.user.email) params.set('customer_email', String(ws.ctx.user.email));
    // Carry tenant + plan on both the session and the subscription so the webhook
    // can set the tenant's plan (and limits) when checkout completes.
    params.set('metadata[tenantId]', String(ws.scope.tenantId));
    params.set('metadata[plan]', plan.id);
    params.set('subscription_data[metadata][tenantId]', String(ws.scope.tenantId));
    params.set('subscription_data[metadata][plan]', plan.id);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return NextResponse.json({ ok: false, error: 'Could not start checkout. Please try again.' }, { status: 502 });
    return NextResponse.json({ ok: true, url: j.url });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}
