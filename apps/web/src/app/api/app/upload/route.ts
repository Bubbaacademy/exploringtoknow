import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';

/**
 * Workspace-scoped manual image upload. Requires a valid workspace session; the
 * created Media is stamped with the ACTOR's tenant/workspace (server-derived, never
 * from the client). Manual upload only — no AI, no image analysis, no paid API.
 */
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: 'Invalid upload.' }, { status: 400 });
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, error: 'Only JPEG, PNG, or WebP are allowed.' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Image too large (max 8 MB).' }, { status: 413 });

  try {
    const payload = await getPayload({ config });
    const buf = Buffer.from(await file.arrayBuffer());
    const alt = (typeof form.get('alt') === 'string' ? (form.get('alt') as string) : '') || file.name || 'product image';
    const doc = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: {
        alt,
        source: 'workspace upload',
        tenant: ws.scope.tenantId as never,
        workspace: ws.scope.workspaceId as never,
      },
      file: { data: buf, mimetype: file.type, name: file.name || `upload-${buf.length}.jpg`, size: buf.length },
    });
    return NextResponse.json({ ok: true, id: doc.id, url: (doc as { url?: string }).url, filename: (doc as { filename?: string }).filename });
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
