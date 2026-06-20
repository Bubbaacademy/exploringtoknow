import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getCampaignsByIds, buildCampaignExport } from '@/lib/ads';
import { campaignsToText, campaignsToCsv } from '@/lib/ads-constants';

/**
 * Manual export of selected ad campaigns + their creatives (Phase 27). canWrite +
 * workspace-scoped. Returns copy-friendly text + CSV for manual setup in an Ads
 * Manager — this is NOT a launch: no ad API, no OAuth, no spend. markExported is an
 * explicit first-party counter only (exportedAt/exportCount).
 */
export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to export campaigns.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => x != null).slice(0, 200) : [];
  if (!ids.length) return NextResponse.json({ ok: false, error: 'Select at least one campaign to export.' }, { status: 422 });

  const docs = await getCampaignsByIds(ws.scope, ids as Array<string | number>);
  if (!docs.length) return NextResponse.json({ ok: false, error: 'No matching campaigns in your workspace.' }, { status: 404 });

  const payloads = await Promise.all(docs.map((d) => buildCampaignExport(ws.scope, d)));

  if (body.markExported === true) {
    const payload = await getPayload({ config });
    const now = new Date().toISOString();
    for (const d of docs) {
      try {
        await payload.update({ collection: 'ad-campaigns', id: d.id as never, overrideAccess: true, data: { exportedAt: now, exportCount: Number(d.exportCount || 0) + 1, updatedBy: ws.ctx.user.id } as never });
      } catch { /* best-effort */ }
    }
  }

  return NextResponse.json({ ok: true, count: payloads.length, text: campaignsToText(payloads), csv: campaignsToCsv(payloads) });
}
