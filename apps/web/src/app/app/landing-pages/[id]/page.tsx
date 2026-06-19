import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceLandingPage, listProductOptions, listRequestOptions, landingViewTotals } from '@/lib/landing';
import { getBrandProfile } from '@/lib/brandkit';
import { LP_STATUS_LABELS, LP_PAGE_TYPE_LABELS, lpStatusVariant } from '@/lib/landing-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { LandingPageEditor } from '@/components/app/LandingPageEditor';
import { LandingSocialSet } from '@/components/app/LandingSocialSet';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ id: string }> };

const refId = (v: unknown): string | number | null => (v == null ? null : (typeof v === 'object' ? ((v as { id?: string | number }).id ?? null) : (v as string | number)));

export default async function EditLandingPage({ params }: Args) {
  const { id } = await params;
  const ws = await requireWorkspace();
  const doc = await getWorkspaceLandingPage(ws.scope, id);
  if (!doc) notFound();
  const d = doc!;
  const editable = canWrite(ws.role);
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [products, requests, brandDoc, totals] = await Promise.all([
    listProductOptions(ws.scope), listRequestOptions(ws.scope), getBrandProfile(ws.scope), landingViewTotals(ws.scope),
  ]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    accentColor: (brandDoc.accentColor as string) || '', affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;
  const views = totals[String(d.id)] || 0;

  const page = {
    id: d.id as string | number,
    title: (d.title as string) || '', slug: (d.slug as string) || '', status: String(d.status || 'draft'),
    pageType: String(d.pageType || 'general'), headline: (d.headline as string) || '', subheadline: (d.subheadline as string) || '',
    body: (d.body as string) || '', ctaLabel: (d.ctaLabel as string) || '', ctaUrl: (d.ctaUrl as string) || '',
    disclosureText: (d.disclosureText as string) || '', seoTitle: (d.seoTitle as string) || '', seoDescription: (d.seoDescription as string) || '',
    noindex: d.noindex !== false, publishedAt: (d.publishedAt as string) || '',
    relatedProduct: refId(d.relatedProduct), relatedRequest: refId(d.relatedRequest),
    sections: Array.isArray(d.sections) ? d.sections : [],
  };

  return (
    <>
      <TopBar
        title={page.title || 'Landing page'}
        sub={<>Status: {LP_STATUS_LABELS[page.status] || page.status} · {LP_PAGE_TYPE_LABELS[page.pageType] || page.pageType} · {views} view{views === 1 ? '' : 's'}</>}
        actions={<>
          {editable ? <WsLink href={`/app/social-posts/new?fromLanding=${d.id}`}>Create social post</WsLink> : null}
          <WsLink href="/app/landing-pages">Back to list</WsLink>
        </>}
      />
      <div className="adm-content">
        {editable ? (
          <>
            <LandingPageEditor page={page} workspaceSlug={wsSlug} products={products} requests={requests} brand={brand} views={views} />
            <LandingSocialSet landingPageId={d.id as string | number} />
          </>
        ) : (
          <Card>
            <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${lpStatusVariant(page.status)}`}>{LP_STATUS_LABELS[page.status] || page.status}</span></div>
            <div className="adm-row"><span className="t">Views</span><strong>{views}</strong></div>
            <div className="adm-row"><span className="t">Headline</span><strong>{page.headline || '—'}</strong></div>
            <p className="adm-note" style={{ marginTop: 8 }}>Your role has read-only access. Ask an owner, admin, or editor to make changes.</p>
          </Card>
        )}
      </div>
    </>
  );
}
