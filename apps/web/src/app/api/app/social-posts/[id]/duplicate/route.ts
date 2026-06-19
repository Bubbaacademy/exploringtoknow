import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceSocialPost } from '@/lib/social';
import { SS_CHANNELS, SS_CHANNEL_LABELS } from '@/lib/social-constants';

/**
 * Duplicate a social post into one or more channels (Phase 26). canWrite, source
 * re-verified to belong to the actor's workspace (cross-tenant duplication is
 * impossible — the source is scoped, and copies are stamped to the same workspace).
 * Copies are ALWAYS draft, carry duplicatedFrom, and copy is NOT rewritten/generated.
 * No publish, schedule, API call, or metrics.
 */
type Ctx = { params: Promise<{ id: string }> };
const refId = (v: unknown): unknown => (v && typeof v === 'object' ? (v as { id?: unknown }).id ?? null : v ?? null);

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to duplicate social posts.' }, { status: 403 });

  const src = await getWorkspaceSocialPost(ws.scope, id);
  if (!src) return NextResponse.json({ ok: false, error: 'Social post not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const raw = Array.isArray(body.channels) ? body.channels : (body.channel ? [body.channel] : []);
  const channels = [...new Set(raw.map((c) => String(c)).filter((c) => (SS_CHANNELS as readonly string[]).includes(c)))].slice(0, 8);
  if (!channels.length) return NextResponse.json({ ok: false, error: 'Pick at least one valid channel to duplicate into.' }, { status: 422 });

  const baseName = String(src.name || 'Social post').replace(/ \((Instagram|TikTok|YouTube Shorts|LinkedIn|Facebook|X \/ Twitter|Pinterest|Generic)\)$/, '');
  const created: Array<string | number> = [];
  try {
    const payload = await getPayload({ config });
    for (const channel of channels) {
      const doc = await payload.create({
        collection: 'social-studio-posts', overrideAccess: true,
        data: {
          name: `${baseName} (${SS_CHANNEL_LABELS[channel] || channel})`,
          channel, format: src.format || 'text', status: 'draft',
          hook: src.hook || undefined, caption: src.caption || undefined,
          hashtags: Array.isArray(src.hashtags) && src.hashtags.length ? src.hashtags : undefined,
          ctaLabel: src.ctaLabel || undefined, ctaUrl: src.ctaUrl || undefined,
          disclosureText: src.disclosureText || undefined, platformNotes: src.platformNotes || undefined, notes: src.notes || undefined,
          campaignLabel: src.campaignLabel || undefined, contentPillar: src.contentPillar || undefined,
          priority: src.priority || 'normal', calendarNotes: src.calendarNotes || undefined,
          relatedProduct: refId(src.relatedProduct) as never, relatedRequest: refId(src.relatedRequest) as never,
          relatedLandingPage: refId(src.relatedLandingPage) as never, relatedBrandProfile: refId(src.relatedBrandProfile) as never,
          assignee: refId(src.assignee) as never,
          duplicatedFrom: src.id as never,
          copyCount: 0, exportCount: 0,
          createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
          tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
        } as never,
      });
      created.push(doc.id as string | number);
    }
    return NextResponse.json({ ok: true, created });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not duplicate the post. Please try again.' }, { status: 500 });
  }
}
