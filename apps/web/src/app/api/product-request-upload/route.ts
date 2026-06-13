import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Public single-image upload for the product-request form. Validates type/size,
 * stores via the existing Payload Media collection (persistent volume), and
 * returns the media id/url. No AI, no image analysis — manual upload only.
 */
export async function POST(req: Request) {
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
      data: { alt, source: 'manual upload (product request)' },
      file: { data: buf, mimetype: file.type, name: file.name || `upload-${buf.length}.jpg`, size: buf.length },
    });
    return NextResponse.json({ ok: true, id: doc.id, url: (doc as any).url, filename: (doc as any).filename });
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
