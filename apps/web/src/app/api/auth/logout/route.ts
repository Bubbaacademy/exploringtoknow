import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/session';

/** Clears the Payload session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true, redirect: '/' });
  clearAuthCookie(res);
  return res;
}

export async function GET(req: Request) {
  const url = new URL('/', req.url);
  const res = NextResponse.redirect(url);
  clearAuthCookie(res);
  return res;
}
