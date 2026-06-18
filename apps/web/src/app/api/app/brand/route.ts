import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveWorkspace } from '@/lib/workspace';
import { canManageBrand } from '@/lib/roles';
import { getBrandProfile } from '@/lib/brandkit';

/**
 * Upsert the workspace Brand Profile (one per workspace). Owner/admin only.
 * Tenant/workspace are derived from the session — never client input. No AI,
 * publishing, billing, email, or external calls; this only stores brand identity.
 */
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const colorOk = (v: string) => v === '' || /^#?[0-9a-fA-F]{3,8}$/.test(v);

export async function POST(req: Request) {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user || ws.scope.tenantId == null) {
    return NextResponse.json({ ok: false, error: 'Not signed in to a workspace.' }, { status: 401 });
  }
  if (!canManageBrand(ws.role)) {
    return NextResponse.json({ ok: false, error: 'Only the workspace owner or an admin can edit the brand kit.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const data = {
    brandName: str(body.brandName, 200),
    publicationName: str(body.publicationName, 200),
    description: str(body.description, 2000),
    targetAudience: str(body.targetAudience, 2000),
    brandVoice: str(body.brandVoice, 2000),
    editorialStyle: str(body.editorialStyle, 2000),
    primaryColor: str(body.primaryColor, 16),
    accentColor: str(body.accentColor, 16),
    websiteUrl: str(body.websiteUrl, 300),
    socialLinks: str(body.socialLinks, 2000),
    affiliateDisclosure: str(body.affiliateDisclosure, 2000),
    focusNotes: str(body.focusNotes, 2000),
  };
  if (!colorOk(data.primaryColor) || !colorOk(data.accentColor)) {
    return NextResponse.json({ ok: false, error: 'Colors must be hex, e.g. #14543f.' }, { status: 422 });
  }

  try {
    const payload = await getPayload({ config });
    const existing = await getBrandProfile(ws.scope);
    const scoped = { ...data, tenant: ws.scope.tenantId, workspace: ws.scope.workspaceId } as never;
    if (existing) {
      await payload.update({ collection: 'brand-profiles', id: existing.id as never, overrideAccess: true, data: scoped });
      return NextResponse.json({ ok: true, id: existing.id, updated: true });
    }
    const doc = await payload.create({ collection: 'brand-profiles', overrideAccess: true, data: scoped });
    return NextResponse.json({ ok: true, id: doc.id, created: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not save the brand profile. Please try again.' }, { status: 500 });
  }
}
