import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceSocialPost, listLandingPageOptions, listAssigneeOptions } from '@/lib/social';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { SS_CHANNEL_LABELS, SS_FORMAT_LABELS, SS_STATUS_LABELS, ssStatusVariant } from '@/lib/social-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { SocialPostEditor } from '@/components/app/SocialPostEditor';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ id: string }> };

const refId = (v: unknown): string | number | null => (v == null ? null : (typeof v === 'object' ? ((v as { id?: string | number }).id ?? null) : (v as string | number)));

export default async function EditSocialPost({ params }: Args) {
  const { id } = await params;
  const ws = await requireWorkspace();
  const doc = await getWorkspaceSocialPost(ws.scope, id);
  if (!doc) notFound();
  const d = doc!;
  const editable = canWrite(ws.role);
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [products, requests, landingPages, assignees, brandDoc] = await Promise.all([
    listProductOptions(ws.scope), listRequestOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug), listAssigneeOptions(ws.scope), getBrandProfile(ws.scope),
  ]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    targetAudience: (brandDoc.targetAudience as string) || '', accentColor: (brandDoc.accentColor as string) || '',
    affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;

  const post = {
    id: d.id as string | number,
    name: (d.name as string) || '', channel: String(d.channel || 'generic'), format: String(d.format || 'text'),
    status: String(d.status || 'draft'),
    hook: (d.hook as string) || '', caption: (d.caption as string) || '',
    hashtags: Array.isArray(d.hashtags) ? (d.hashtags as string[]) : [],
    ctaLabel: (d.ctaLabel as string) || '', ctaUrl: (d.ctaUrl as string) || '',
    disclosureText: (d.disclosureText as string) || '', platformNotes: (d.platformNotes as string) || '', notes: (d.notes as string) || '',
    relatedProduct: refId(d.relatedProduct), relatedRequest: refId(d.relatedRequest), relatedLandingPage: refId(d.relatedLandingPage),
    copyCount: Number(d.copyCount || 0),
    plannedDate: (d.plannedDate as string) || '', campaignLabel: (d.campaignLabel as string) || '',
    contentPillar: (d.contentPillar as string) || '', priority: String(d.priority || 'normal'),
    assignee: refId(d.assignee), calendarNotes: (d.calendarNotes as string) || '', duplicatedFrom: refId(d.duplicatedFrom),
  };

  return (
    <>
      <TopBar
        title={post.name || 'Social post'}
        sub={<>{SS_CHANNEL_LABELS[post.channel] || post.channel} · {SS_FORMAT_LABELS[post.format] || post.format} · {SS_STATUS_LABELS[post.status] || post.status}</>}
        actions={<WsLink href="/app/social-posts">Back to list</WsLink>}
      />
      <div className="adm-content">
        {editable ? (
          <SocialPostEditor
            post={post}
            products={products} requests={requests} landingPages={landingPages} assignees={assignees}
            brand={brand} brandProfileId={brandDoc?.id ?? null}
          />
        ) : (
          <Card>
            <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${ssStatusVariant(post.status)}`}>{SS_STATUS_LABELS[post.status] || post.status}</span></div>
            <div className="adm-row"><span className="t">Channel</span><strong>{SS_CHANNEL_LABELS[post.channel] || post.channel}</strong></div>
            <div className="adm-row"><span className="t">Hook</span><strong>{post.hook || '—'}</strong></div>
            <p className="adm-note" style={{ marginTop: 8 }}>Your role has read-only access. Ask an owner, admin, or editor to make changes.</p>
          </Card>
        )}
      </div>
    </>
  );
}
