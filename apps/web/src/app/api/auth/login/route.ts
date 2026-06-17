import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { setAuthCookie } from '@/lib/session';

/**
 * Public login for workspace users (and operators). Authenticates against the
 * Payload `users` collection and sets the `payload-token` cookie, then the client
 * is sent to /app. Super admins can navigate on to /platform, /dashboard, /admin.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Enter your email and password.' }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });
    const login = await payload.login({ collection: 'users', data: { email, password } });
    if (!login?.token) return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
    const res = NextResponse.json({ ok: true, redirect: '/app' });
    setAuthCookie(res, login.token, (login as { exp?: number }).exp);
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
  }
}
