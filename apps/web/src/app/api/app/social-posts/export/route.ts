import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getSocialPostsByIds } from '@/lib/social';
import { rowsToCsv, rowsToText, type ExportRow } from '@/lib/social-constants';

/**
 * Manual bulk copy/export of selected social posts (Phase 26). canWrite + workspace-
 * scoped (only the actor's own posts are loaded). Returns copy-friendly text + CSV —
 * this is NOT social publishing: no external API, no OAuth, no scheduling. If
 * markExported is set, posts get a first-party exportedAt/exportCount bump (no send).
 */
const relLabel = (d: Record<string, unknown>): string => {
  const lp = d.relatedLandingPage; if (lp && typeof lp === 'object') return `Landing: ${String((lp as Record<string, unknown>).title ?? '')}`;
  const p = d.relatedProduct; if (p && typeof p === 'object') return `Product: ${String((p as Record<string, unknown>).name ?? '')}`;
  const r = d.relatedRequest; if (r && typeof r === 'object') return `Request: ${String((r as Record<string, unknown>).productName ?? '')}`;
  return '';
};

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canWrite(ws.role)) {
    return NextResponse.json({ ok: false, error: 'You don’t have permission to export social posts.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x) => x != null).slice(0, 500) : [];
  if (!ids.length) return NextResponse.json({ ok: false, error: 'Select at least one post to export.' }, { status: 422 });

  const docs = await getSocialPostsByIds(ws.scope, ids as Array<string | number>);
  if (!docs.length) return NextResponse.json({ ok: false, error: 'No matching posts in your workspace.' }, { status: 404 });

  const rows: ExportRow[] = docs.map((d) => ({
    name: String(d.name ?? ''), channel: String(d.channel ?? 'generic'), format: String(d.format ?? ''),
    status: String(d.status ?? ''), plannedDate: String(d.plannedDate ?? ''), campaignLabel: String(d.campaignLabel ?? ''),
    hook: String(d.hook ?? ''), caption: String(d.caption ?? ''), ctaLabel: String(d.ctaLabel ?? ''), ctaUrl: String(d.ctaUrl ?? ''),
    hashtags: Array.isArray(d.hashtags) ? d.hashtags : [], disclosureText: String(d.disclosureText ?? ''), relatedLabel: relLabel(d),
  }));

  // Explicit, manual "mark exported" — first-party counter only (no external call).
  if (body.markExported === true) {
    const payload = await getPayload({ config });
    const now = new Date().toISOString();
    for (const d of docs) {
      try {
        await payload.update({ collection: 'social-studio-posts', id: d.id as never, overrideAccess: true,
          data: { exportedAt: now, exportCount: Number(d.exportCount || 0) + 1, updatedBy: ws.ctx.user.id } as never });
      } catch { /* best-effort; export still returns */ }
    }
  }

  return NextResponse.json({ ok: true, count: rows.length, text: rowsToText(rows), csv: rowsToCsv(rows) });
}
