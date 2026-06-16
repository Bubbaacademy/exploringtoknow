import type { Metadata } from 'next';
import Link from 'next/link';
import { getPayload } from 'payload';
import config from '@payload-config';
import { SITE_NAME } from '@/lib/public';
import { hashToken } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Unsubscribe — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

type Args = { searchParams: Promise<{ token?: string | string[] }> };

async function unsubscribe(token: string): Promise<'ok' | 'already' | 'invalid'> {
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
    if (String(doc.status) === 'unsubscribed') return 'already';
    await payload.update({
      collection: 'newsletter-subscribers', id: doc.id as number, overrideAccess: true,
      data: { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() },
    });
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export default async function UnsubscribePage({ searchParams }: Args) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] ?? '' : sp.token ?? '';
  const result = await unsubscribe(token);
  return (
    <section className="section">
      <div className="container">
        <div className="empty-panel">
          {result === 'ok' || result === 'already' ? (
            <>
              <span className="eyebrow">Newsletter</span>
              <h1>You’re unsubscribed</h1>
              <p>{result === 'already' ? 'You were already unsubscribed.' : 'You won’t receive any more newsletter emails. We’re sorry to see you go.'} You can resubscribe any time.</p>
            </>
          ) : (
            <>
              <span className="eyebrow">Newsletter</span>
              <h1>This unsubscribe link isn’t valid</h1>
              <p>The link may be incomplete or expired. If you keep receiving emails, please contact us.</p>
            </>
          )}
          <div className="empty-panel-actions">
            <Link href="/" className="btn btn-ghost">Back to home</Link>
            <Link href="/contact" className="btn btn-accent">Contact us</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
