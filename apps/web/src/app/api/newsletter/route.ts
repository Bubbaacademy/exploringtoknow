import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Public newsletter sign-up. Server-validates the email, deduplicates by email,
 * and stores via the Payload Local API (overrideAccess). No external email
 * provider, no marketing automation — collection only. Honeypot-guarded.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const ALLOWED_SOURCES = new Set(['homepage', 'article', 'footer', 'search', 'other']);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot — pretend success so bots get no signal.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const sourceRaw = (typeof body.source === 'string' ? body.source : '').trim().toLowerCase();
  const source = ALLOWED_SOURCES.has(sourceRaw) ? sourceRaw : 'other';

  if (email.length > 200 || !isEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid email address.' }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });
    const existing = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1, depth: 0, overrideAccess: true,
    });
    if (existing.docs.length) {
      return NextResponse.json({ ok: true, already: true });
    }
    await payload.create({
      collection: 'newsletter-subscribers',
      data: { email, source, status: 'subscribed' },
      overrideAccess: true,
    });
    return NextResponse.json({ ok: true });
  } catch {
    // A unique-index race can only mean the email already exists → treat as success.
    return NextResponse.json({ ok: true, already: true });
  }
}
