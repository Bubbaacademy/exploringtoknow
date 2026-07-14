import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { emailEnabled, sendEmail } from '@/lib/email';

/**
 * BubbaAffiliate public gateway intake (Phase 1B / 2A).
 *
 * Collects SELLER offer interest and CREATOR Partner applications from the public
 * /bubbaaffiliate gateway. Both are stored as `contact-messages` docs via the
 * Payload Local API (overrideAccess) — the SAME safe, intake-only primitive used by
 * /api/contact. No new schema, no CRM, no CreatorProfile tables, no social OAuth.
 *
 * Discriminated by `source`:
 *   - seller  -> source = 'bubbaaffiliate-seller'
 *   - creator -> source = 'bubbaaffiliate-creator'
 * `reason` is set to the existing 'partnership' option; the structured details are
 * composed into the `message` field so nothing is lost. Honeypot-guarded, server
 * validated. The public can never read messages.
 */

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);
const clip = (s: string, n: number) => s.slice(0, n);
const line = (label: string, value: string) => `${label}: ${value || '—'}`;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot — silent success so bots get no signal.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const get = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');
  const kind = get('kind');
  if (kind !== 'seller' && kind !== 'creator') {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const name = clip(get('name'), 120);
  const email = clip(get('email').toLowerCase(), 200);

  const errors: string[] = [];
  if (!isEmail(email)) errors.push('a valid email');

  let subject = '';
  let message = '';
  let productUrl = '';
  let source = '';

  if (kind === 'seller') {
    const businessName = clip(get('businessName'), 160);
    const offerType = clip(get('offerType'), 80);
    const website = get('website');
    const commissionIdea = clip(get('commissionIdea'), 200);
    const offer = clip(get('offer'), 5000);

    if (offer.length < 10) errors.push('a short description of your offer (at least 10 characters)');
    if (website && !isUrl(website)) errors.push('a valid website URL (or leave it blank)');
    if (errors.length) {
      return NextResponse.json({ ok: false, error: `Please provide ${errors.join(', ')}.` }, { status: 422 });
    }

    source = 'bubbaaffiliate-seller';
    productUrl = isUrl(website) ? website : '';
    subject = `Seller offer intake — ${businessName || name || email}`.slice(0, 200);
    message = [
      '[BubbaAffiliate — Seller / Offer intake]',
      line('Contact', name || '—'),
      line('Business / brand', businessName),
      line('Offer type', offerType),
      line('Website', website),
      line('Proposed commission', commissionIdea),
      '',
      'What they want to promote:',
      offer,
    ].join('\n');
  } else {
    const platform = clip(get('platform'), 80);
    const handle = clip(get('handle'), 160);
    const profileUrl = get('profileUrl');
    const audience = clip(get('audience'), 200);
    const about = clip(get('about'), 5000);

    if (about.length < 10) errors.push('a short note about your audience and content (at least 10 characters)');
    if (profileUrl && !isUrl(profileUrl)) errors.push('a valid profile URL (or leave it blank)');
    if (errors.length) {
      return NextResponse.json({ ok: false, error: `Please provide ${errors.join(', ')}.` }, { status: 422 });
    }

    source = 'bubbaaffiliate-creator';
    productUrl = isUrl(profileUrl) ? profileUrl : '';
    subject = `Creator Partner application — ${handle || name || email}`.slice(0, 200);
    message = [
      '[BubbaAffiliate — Creator Partner application]',
      line('Name', name || '—'),
      line('Primary platform', platform),
      line('Handle', handle),
      line('Profile URL', profileUrl),
      line('Audience / niche', audience),
      '',
      'About their audience and content:',
      about,
    ].join('\n');
  }

  try {
    const payload = await getPayload({ config });

    // Optional best-effort inbox notification — never blocks the user. No-op unless
    // a provider is configured AND CONTACT_NOTIFY_TO is set (same contract as /api/contact).
    let notifyStatus = 'local_no_send';
    const notifyTo = process.env.CONTACT_NOTIFY_TO;
    if (notifyTo && emailEnabled()) {
      try {
        const r = await sendEmail({
          to: notifyTo,
          subject: `New ${kind === 'seller' ? 'seller offer' : 'creator'} intake — ${subject}`,
          html: `<p><strong>From:</strong> ${name || '(no name)'} &lt;${email}&gt;</p><pre>${message.replace(/</g, '&lt;')}</pre>`,
          text: `From: ${name || ''} <${email}>\n\n${message}`,
        });
        notifyStatus = r.status;
      } catch {
        notifyStatus = 'error_network';
      }
    }

    await payload.create({
      collection: 'contact-messages',
      overrideAccess: true,
      data: {
        name: name || undefined,
        email,
        reason: 'partnership',
        subject,
        message,
        productUrl: productUrl || undefined,
        status: 'new',
        source,
        notifyStatus,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not submit right now. Please try again.' }, { status: 500 });
  }
}
