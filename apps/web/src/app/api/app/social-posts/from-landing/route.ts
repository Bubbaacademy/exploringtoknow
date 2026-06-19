import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceLandingPage } from '@/lib/landing';
import { SS_CHANNELS, SS_CHANNEL_LABELS, isSafeHttpUrl } from '@/lib/social-constants';

/**
 * Create a manual content set: N EMPTY draft social posts from a landing page (Phase
 * 26). canWrite, landing page re-verified in the actor's workspace. Each draft has the
 * landing page preselected + CTA URL prefilled from its PUBLISHED public URL — captions
 * are NOT generated, nothing is published/scheduled, no API/AI is called.
 */
export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  if (!canWrite(ws.role)) return NextResponse.json({ ok: false, error: 'You don’t have permission to create social posts.' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }
  const lp = await getWorkspaceLandingPage(ws.scope, String(body.landingPageId ?? ''));
  if (!lp) return NextResponse.json({ ok: false, error: 'Landing page not found in your workspace.' }, { status: 404 });

  const raw = Array.isArray(body.channels) ? body.channels : [];
  const channels = [...new Set(raw.map((c) => String(c)).filter((c) => (SS_CHANNELS as readonly string[]).includes(c)))].slice(0, 8);
  if (!channels.length) return NextResponse.json({ ok: false, error: 'Pick at least one channel.' }, { status: 422 });

  const base = (process.env.PAYLOAD_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
  const wsSlug = (ws.workspace?.slug as string) || '';
  const published = String(lp.status) === 'published' && lp.slug && wsSlug && base;
  const publicUrl = published ? `${base}/lp/${wsSlug}/${String(lp.slug)}` : '';
  const ctaUrl = isSafeHttpUrl(publicUrl) ? publicUrl : '';
  const title = String(lp.title || `Page ${lp.id}`);

  const created: Array<string | number> = [];
  try {
    const payload = await getPayload({ config });
    for (const channel of channels) {
      const doc = await payload.create({
        collection: 'social-studio-posts', overrideAccess: true,
        data: {
          name: `${title} — ${SS_CHANNEL_LABELS[channel] || channel}`,
          channel, format: 'text', status: 'draft',
          ctaLabel: ctaUrl ? 'Read more' : undefined, ctaUrl: ctaUrl || undefined,
          relatedLandingPage: lp.id as never,
          copyCount: 0, exportCount: 0,
          createdBy: ws.ctx.user.id, updatedBy: ws.ctx.user.id,
          tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId,
        } as never,
      });
      created.push(doc.id as string | number);
    }
    return NextResponse.json({ ok: true, created, prefilled: Boolean(ctaUrl) });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not create the content set. Please try again.' }, { status: 500 });
  }
}
