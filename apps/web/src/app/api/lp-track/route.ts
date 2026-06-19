import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * First-party landing-page view ping (Phase 24). Records ONE increment per
 * (PUBLISHED landing page, UTC day) in `landing-page-views`. Privacy-light: no IP,
 * no personal data — only a landing page id + day bucket; tenant/workspace are
 * copied from the page itself (server-derived). Always 204 (fire-and-forget).
 */
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|preview|headless|phantom|puppeteer|playwright|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|httpclient|go-http|java\/|okhttp|scrapy/i;

const refId = (v: unknown): number | string | null =>
  v == null ? null : (typeof v === 'object' ? ((v as { id?: number | string }).id ?? null) : (v as number | string));

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new NextResponse(null, { status: 204 }); }
  const id = Number((body as { id?: unknown }).id);
  if (!Number.isFinite(id) || id <= 0) return new NextResponse(null, { status: 204 });

  try {
    const payload = await getPayload({ config });
    // Count ONLY published landing pages.
    const lp = await payload.find({
      collection: 'landing-pages',
      where: { and: [{ id: { equals: id } }, { status: { equals: 'published' } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    const page = lp.docs[0];
    if (!page) return new NextResponse(null, { status: 204 });

    const viewDate = new Date().toISOString().slice(0, 10);
    const existing = await payload.find({
      collection: 'landing-page-views',
      where: { and: [{ landingPage: { equals: id } }, { viewDate: { equals: viewDate } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    if (existing.docs.length) {
      const row = existing.docs[0] as Record<string, unknown>;
      await payload.update({ collection: 'landing-page-views', id: row.id as number, overrideAccess: true, data: { count: Number(row.count || 0) + 1 } });
    } else {
      await payload.create({
        collection: 'landing-page-views', overrideAccess: true,
        data: { landingPage: id, tenant: refId(page.tenant) as never, workspace: refId(page.workspace) as never, viewDate, count: 1 } as never,
      });
    }
  } catch { /* never surface tracking errors */ }
  return new NextResponse(null, { status: 204 });
}
