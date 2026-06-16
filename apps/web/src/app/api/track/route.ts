import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * First-party pageview ping. Records ONE increment per (published article, UTC day)
 * in `article-views`. Privacy-light: no IP, no personal data — only an article id
 * and a day bucket. Always responds 204 (fire-and-forget, no info leak). Drafts are
 * never counted (the article must be editorialStatus=published).
 */
// Obvious automated clients we never count (best-effort; not security).
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|preview|headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|httpclient|go-http|java\/|okhttp|scrapy/i;

export async function POST(req: Request) {
  // Lightweight bot filtering: skip empty/obvious-bot user agents.
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const id = Number((body as { id?: unknown }).id);
  if (!Number.isFinite(id) || id <= 0) return new NextResponse(null, { status: 204 });

  try {
    const payload = await getPayload({ config });
    // Count ONLY published article views.
    const art = await payload.find({
      collection: 'articles',
      where: { and: [{ id: { equals: id } }, { editorialStatus: { equals: 'published' } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    if (!art.docs.length) return new NextResponse(null, { status: 204 });

    const viewDate = new Date().toISOString().slice(0, 10);
    const existing = await payload.find({
      collection: 'article-views',
      where: { and: [{ article: { equals: id } }, { viewDate: { equals: viewDate } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    if (existing.docs.length) {
      const row = existing.docs[0] as Record<string, unknown>;
      await payload.update({
        collection: 'article-views', id: row.id as number, overrideAccess: true,
        data: { count: Number(row.count || 0) + 1 },
      });
    } else {
      await payload.create({
        collection: 'article-views', overrideAccess: true,
        data: { article: id, viewDate, count: 1 },
      });
    }
  } catch {
    /* never surface tracking errors to the client */
  }
  return new NextResponse(null, { status: 204 });
}
