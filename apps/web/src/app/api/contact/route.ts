import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Public contact intake. Server-validated, honeypot-guarded. Stores a
 * `contact-messages` doc via the Local API (overrideAccess). No email provider is
 * required — messages are captured for admin review; provider sending can be added
 * later without changing this contract.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);
const REASONS = new Set(['suggest_product', 'correction', 'partnership', 'general']);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot — silent success.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const get = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');
  const name = get('name').slice(0, 120);
  const email = get('email').toLowerCase();
  const reasonRaw = get('reason');
  const reason = REASONS.has(reasonRaw) ? reasonRaw : 'general';
  const subject = get('subject').slice(0, 200);
  const message = get('message');
  const productUrl = get('productUrl');

  const errors: string[] = [];
  if (email.length > 200 || !isEmail(email)) errors.push('a valid email');
  if (message.length < 10) errors.push('a message (at least 10 characters)');
  if (message.length > 5000) errors.push('a shorter message');
  if (productUrl && !isUrl(productUrl)) errors.push('a valid product URL');
  if (errors.length) {
    return NextResponse.json({ ok: false, error: `Please provide ${errors.join(', ')}.` }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });
    await payload.create({
      collection: 'contact-messages',
      overrideAccess: true,
      data: {
        name: name || undefined,
        email,
        reason,
        subject: subject || undefined,
        message,
        productUrl: productUrl || undefined,
        status: 'new',
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not send your message. Please try again.' }, { status: 500 });
  }
}
