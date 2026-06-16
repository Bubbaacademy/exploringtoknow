import type { Metadata } from 'next';
import Link from 'next/link';
import { getPayload } from 'payload';
import config from '@payload-config';
import { SITE_NAME } from '@/lib/public';
import { hashToken } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Confirm subscription — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

type Args = { searchParams: Promise<{ token?: string | string[] }> };

async function confirm(token: string): Promise<'ok' | 'already' | 'invalid'> {
  if (!token || token.length < 8 || token.length > 200) return 'invalid';
  try {
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: 'newsletter-subscribers',
      where: { tokenHash: { equals: hashToken(token) } },
      limit: 1, depth: 0, overrideAccess: true,
    });
    const doc = res.docs[0] as Record<string, unknown> | undefined;
    if (!doc) return 'invalid';
    if (String(doc.status) === 'active' || String(doc.status) === 'subscribed') return 'already';
    await payload.update({
      collection: 'newsletter-subscribers', id: doc.id as number, overrideAccess: true,
      data: { status: 'active', confirmedAt: new Date().toISOString() },
    });
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export default async function ConfirmPage({ searchParams }: Args) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] ?? '' : sp.token ?? '';
  const result = await confirm(token);
  return (
    <section className="section">
      <div className="container">
        <div className="empty-panel">
          {result === 'ok' || result === 'already' ? (
            <>
              <span className="eyebrow">Newsletter</span>
              <h1>You’re subscribed{result === 'already' ? '' : ' 🎉'}</h1>
              <p>{result === 'already' ? 'Your subscription is already confirmed.' : 'Thanks for confirming — practical buying guides and honest product research are on the way.'}</p>
            </>
          ) : (
            <>
              <span className="eyebrow">Newsletter</span>
              <h1>This confirmation link isn’t valid</h1>
              <p>The link may be incomplete or expired. You can sign up again from any page.</p>
            </>
          )}
          <div className="empty-panel-actions">
            <Link href="/explore" className="btn btn-accent">Explore guides</Link>
            <Link href="/" className="btn btn-ghost">Back to home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
