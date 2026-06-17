import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { createWorkspaceOnboarding, signupEnabled, requireEmailVerification, OnboardingError } from '@/lib/onboarding';
import { setAuthCookie } from '@/lib/session';

/**
 * Public signup → provisions a User + Tenant + Workspace + owner Membership and
 * logs the new owner in (unless email verification is required). Gated by
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

    if (requireEmailVerification()) {
      return NextResponse.json({ ok: true, verify: true, message: 'Account created. Check your email to verify before signing in.' });
    }

    // Auto-login the new owner.
    const payload = await getPayload({ config });
    const login = await payload.login({ collection: 'users', data: { email: str('email').trim().toLowerCase(), password: str('password') } });
    const res = NextResponse.json({ ok: true, redirect: '/app' });
    if (login?.token) setAuthCookie(res, login.token, (login as { exp?: number }).exp);
    return res;
  } catch (e) {
    if (e instanceof OnboardingError) {
      const status = e.code === 'DUPLICATE_EMAIL' ? 409 : e.code === 'DISABLED' ? 403 : 422;
      return NextResponse.json({ ok: false, error: e.message, field: e.field, code: e.code }, { status });
    }
    return NextResponse.json({ ok: false, error: 'Could not create your account. Please try again.' }, { status: 500 });
  }
}
