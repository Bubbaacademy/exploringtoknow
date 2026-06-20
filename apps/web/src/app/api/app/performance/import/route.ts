import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { landingPageIdBySlug } from '@/lib/performance';
import { PERF_PLATFORMS, PERF_CHANNEL_TYPES, parseCsv, coerceNumber } from '@/lib/performance-constants';

/**
 * Paste-based CSV import for manual performance data (Phase 28). canWrite + workspace-
 * scoped. Parses pasted text ONLY (no file upload), validates rows, and either previews
 * or creates entries. NO external API, NO platform auto-detect — fully manual/transparent.
 * Expected columns: date, platform, channel, campaign, ad_set, creative, impressions,
 * clicks, spend, conversions, revenue, leads, landing_page_slug | landing_page_url, notes.
 */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const slugFromUrl = (u: string): string => {
  const m = u.match(/\/lp\/[^/]+\/([^/?#]+)/i); if (m && m[1]) return m[1];
  const parts = u.split(/[/?#]/).filter(Boolean); return parts.length ? String(parts[parts.length - 1]) : '';
};

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to import performance.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const csv = typeof body.csv === 'string' ? body.csv : '';
  const preview = body.preview === true;
  const rows = parseCsv(csv);
  if (rows.length < 2) return NextResponse.json({ ok: false, error: 'Paste a header row plus at least one data row.' }, { status: 422 });

  const header = (rows[0] || []).map(norm);
  const idx = (name: string) => header.indexOf(name);
  const col = (r: string[], name: string): string => { const i = idx(name); return i >= 0 && i < r.length ? String(r[i] ?? '').trim() : ''; };

  const accepted: Array<Record<string, unknown>> = [];
  const errors: Array<{ row: number; reason: string }> = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const dateRaw = col(r, 'date');
    const entryDate = isDate(dateRaw) ? dateRaw : '';
    const platform = (PERF_PLATFORMS as readonly string[]).includes(col(r, 'platform')) ? col(r, 'platform') : 'unknown';
    const channelType = (PERF_CHANNEL_TYPES as readonly string[]).includes(col(r, 'channel')) ? col(r, 'channel') : 'generic';
    const impressions = coerceNumber(col(r, 'impressions')), clicks = coerceNumber(col(r, 'clicks')), spend = coerceNumber(col(r, 'spend'));
    const conversions = coerceNumber(col(r, 'conversions')), revenue = coerceNumber(col(r, 'revenue')), leads = coerceNumber(col(r, 'leads'));
    const campaignName = col(r, 'campaign').slice(0, 300);
    const hasSignal = entryDate || campaignName || impressions || clicks || spend || conversions || revenue || leads;
    if (!hasSignal) { errors.push({ row: i + 1, reason: 'empty / no usable data' }); continue; }
    if (dateRaw && !entryDate) { errors.push({ row: i + 1, reason: `bad date "${dateRaw}" (use YYYY-MM-DD)` }); continue; }
    accepted.push({
      sourceType: 'csv_paste', platform, channelType, status: 'recorded',
      entryDate: entryDate || undefined, campaignName: campaignName || undefined,
      adSetName: col(r, 'ad_set').slice(0, 300) || undefined, creativeName: col(r, 'creative').slice(0, 300) || undefined,
      impressions, clicks, spend, conversions, revenue, leads,
      notes: col(r, 'notes').slice(0, 4000) || undefined,
      _lpSlug: col(r, 'landing_page_slug') || (col(r, 'landing_page_url') ? slugFromUrl(col(r, 'landing_page_url')) : ''),
    });
    if (accepted.length >= 1000) break;
  }

  if (preview) {
    return NextResponse.json({ ok: true, preview: true, acceptedCount: accepted.length, rejectedCount: errors.length, errors: errors.slice(0, 50), sample: accepted.slice(0, 10).map(({ _lpSlug, ...rest }) => rest) });
  }
  if (!accepted.length) return NextResponse.json({ ok: false, error: 'No valid rows to import.', rejectedCount: errors.length, errors: errors.slice(0, 50) }, { status: 422 });

  const batchId = `batch_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  let created = 0;
  try {
    const payload = await getPayload({ config });
    for (const a of accepted) {
      const { _lpSlug, ...rest } = a as Record<string, unknown> & { _lpSlug?: string };
      const lpId = _lpSlug ? await landingPageIdBySlug(ws.scope, String(_lpSlug)) : null;
      await payload.create({
        collection: 'performance-entries', overrideAccess: true,
        data: {
          ...rest, importBatchId: batchId,
          relatedLandingPage: (lpId ?? undefined) as never,
          currency: 'USD', createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
          tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
        } as never,
      });
      created++;
    }
    return NextResponse.json({ ok: true, batchId, created, rejectedCount: errors.length, errors: errors.slice(0, 50) });
  } catch {
    return NextResponse.json({ ok: false, error: `Imported ${created} rows, then hit an error. Please retry the rest.`, created }, { status: 500 });
  }
}
