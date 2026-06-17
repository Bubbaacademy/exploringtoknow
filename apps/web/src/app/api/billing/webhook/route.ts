import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Stripe webhook. INERT unless BILLING_ENABLED=true and STRIPE_WEBHOOK_SECRET is
 * set. When active: verifies the signature, then idempotently updates ONLY the
 * matching tenant's billing fields (by client_reference_id / metadata tenantId /
 * customer id). Never touches another tenant. Never logs secrets.
 */
function verify(raw: string, sigHeader: string | null, secret: string): boolean {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map((kv) => kv.split('=')) as [string, string][]);
  const t = parts['t']; const v1 = parts['v1'];
  if (!t || !v1) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1)); } catch { return false; }
}

const tsToDate = (s: unknown): string | undefined => (typeof s === 'number' ? new Date(s * 1000).toISOString() : undefined);

const STATUS_MAP: Record<string, string> = {
  trialing: 'trialing', active: 'active', past_due: 'past_due', canceled: 'canceled',
  unpaid: 'unpaid', incomplete: 'past_due', incomplete_expired: 'canceled', paused: 'past_due',
};

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (process.env.BILLING_ENABLED !== 'true' || !secret) {
    return NextResponse.json({ ok: true, ignored: 'billing-not-configured' }, { status: 200 });
  }
  const raw = await req.text();
  if (!verify(raw, req.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  try {
    const payload = await getPayload({ config });
    const obj = event?.data?.object ?? {};
    const tenantId = obj?.client_reference_id || obj?.metadata?.tenantId || obj?.subscription_details?.metadata?.tenantId;
    const customerId = typeof obj?.customer === 'string' ? obj.customer : undefined;

    // Find the single matching tenant — by id (checkout) or by stored customer id.
    let tenant: { id: number | string } | null = null;
    if (tenantId) { try { tenant = (await payload.findByID({ collection: 'tenants', id: tenantId as never, depth: 0, overrideAccess: true })) as { id: number | string }; } catch { tenant = null; } }
    if (!tenant && customerId) {
      const f = await payload.find({ collection: 'tenants', where: { billingCustomerId: { equals: customerId } }, limit: 1, depth: 0, overrideAccess: true });
      tenant = (f.docs[0] as { id: number | string } | undefined) ?? null;
    }
    if (!tenant) return NextResponse.json({ ok: true, note: 'no matching tenant' }, { status: 200 });

    const data: Record<string, unknown> = {};
    if (event.type === 'checkout.session.completed') {
      if (customerId) data.billingCustomerId = customerId;
      if (typeof obj.subscription === 'string') data.billingSubscriptionId = obj.subscription;
      data.subscriptionStatus = 'active';
    } else if (event.type?.startsWith('customer.subscription')) {
      data.billingSubscriptionId = String(obj.id ?? '') || undefined;
      data.subscriptionStatus = STATUS_MAP[String(obj.status)] ?? 'active';
      data.cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end);
      data.currentPeriodStart = tsToDate(obj.current_period_start);
      data.currentPeriodEnd = tsToDate(obj.current_period_end);
      if (event.type === 'customer.subscription.deleted') data.subscriptionStatus = 'canceled';
    } else {
      return NextResponse.json({ ok: true, ignored: event.type }, { status: 200 });
    }

    // Idempotent: writing the same status/ids again is a no-op in effect.
    await payload.update({ collection: 'tenants', id: tenant.id, overrideAccess: true, data: data as never });
    return NextResponse.json({ ok: true, received: event.type });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
