import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { SITE_URL } from '@/lib/public';
import { isDoubleOptIn, makeToken, newsletterProvider, sendConfirmationEmail } from '@/lib/newsletter';

/**
 * Public newsletter sign-up. Server-validates the email, deduplicates by email,
 * and stores via the Payload Local API (overrideAccess). Local mode (default)
 * activates immediately; provider + double opt-in mode creates a pending record
 * and sends a confirmation. Honeypot-guarded. Never deletes records.
 */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const ALLOWED_SOURCES = new Set(['homepage', 'article', 'footer', 'search', 'contact', 'other']);

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

  const doubleOptIn = isDoubleOptIn();
  const provider = newsletterProvider();

  try {
    const payload = await getPayload({ config });
    const existing = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1, depth: 0, overrideAccess: true,
    });

    const { token, hash } = makeToken();

    if (existing.docs.length) {
      const doc = existing.docs[0] as Record<string, unknown>;
      const status = String(doc.status || '');
      if (status === 'unsubscribed' || status === 'bounced' || status === 'complained') {
        // Re-subscribe: flip status, refresh token; never create a duplicate row.
        await payload.update({
          collection: 'newsletter-subscribers', id: doc.id as number, overrideAccess: true,
          data: {
            status: doubleOptIn ? 'pending' : 'active',
            source, provider, tokenHash: hash,
            unsubscribedAt: null,
            confirmedAt: doubleOptIn ? null : new Date().toISOString(),
          },
        });
        if (doubleOptIn) await sendConfirmationEmail(email, `${SITE_URL}/newsletter/confirm?token=${token}`);
        return NextResponse.json({ ok: true, resubscribed: true });
      }
      return NextResponse.json({ ok: true, already: true });
    }

    await payload.create({
      collection: 'newsletter-subscribers',
      overrideAccess: true,
      data: {
        email, source, provider, tokenHash: hash,
        status: doubleOptIn ? 'pending' : 'active',
        confirmedAt: doubleOptIn ? undefined : new Date().toISOString(),
      },
    });
    if (doubleOptIn) await sendConfirmationEmail(email, `${SITE_URL}/newsletter/confirm?token=${token}`);
    return NextResponse.json({ ok: true, pending: doubleOptIn });
  } catch {
    // A unique-index race can only mean the email already exists → treat as success.
    return NextResponse.json({ ok: true, already: true });
  }
}
