import { NextResponse } from 'next/server';
import { createWorkspaceOnboarding, signupEnabled, requireEmailVerification, freeTrialDays, OnboardingError } from '@/lib/onboarding';
import { payloadRestLogin, forwardCookies } from '@/lib/session';
import { sendWelcomeEmail } from '@/lib/email-templates';

/**
 * Public signup → provisions a User + Tenant + Workspace + owner Membership and
 * logs the new owner in (unless email verification is required) by delegating to
 * Payload's REST login and forwarding its session cookie. Gated by
 * PUBLIC_SIGNUP_ENABLED. Honeypot-guarded. No content/generation is ever created.
 */
export async function POST(req: Request) {
  if (!signupEnabled()) {
    return NextResponse.json({ ok: false, error: 'Signups are not open yet. Please check back soon.', code: 'DISABLED' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }

  // Honeypot — pretend success so bots get no signal.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return NextResponse.json({ ok: true, redirect: '/app' });
  }

  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '');
  const email = str('email').trim().toLowerCase();

  try {
    await createWorkspaceOnboarding({
      fullName: str('fullName'),
      email: str('email'),
      password: str('password'),
      businessName: str('businessName'),
      workspaceName: str('workspaceName'),
      slugSuggestion: str('slug'),
      website: str('website'),
      source: 'public_signup',
    });

    // Best-effort welcome email (local-safe no-op if no provider). Never blocks signup.
    const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || new URL(req.url).origin;
    try {
      await sendWelcomeEmail(email, {
        workspaceName: str('workspaceName') || str('businessName'),
        trialDays: freeTrialDays(),
        appUrl: `${base}/app`,
      });
    } catch { /* welcome email is non-critical — signup already succeeded */ }

    if (requireEmailVerification()) {
      return NextResponse.json({ ok: true, verify: true, message: 'Account created. Check your email to verify before signing in.' });
    }

    // Auto-login the new owner via Payload's REST login (proper session cookie).
    const { ok, cookies } = await payloadRestLogin(new URL(req.url).origin, email, str('password'));
    const res = NextResponse.json({ ok: true, redirect: ok && cookies.length ? '/app' : '/login', loggedIn: ok && cookies.length > 0 });
    if (ok && cookies.length) forwardCookies(res, cookies);
    return res;
  } catch (e) {
    if (e instanceof OnboardingError) {
      const status = e.code === 'DUPLICATE_EMAIL' ? 409 : e.code === 'DISABLED' ? 403 : 422;
      return NextResponse.json({ ok: false, error: e.message, field: e.field, code: e.code }, { status });
    }
    return NextResponse.json({ ok: false, error: 'Could not create your account. Please try again.' }, { status: 500 });
  }
}
