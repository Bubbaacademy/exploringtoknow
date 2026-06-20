import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceCampaign, listCampaignCreatives, listSocialPostOptions } from '@/lib/ads';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { listLandingPageOptions } from '@/lib/social';
import { getBrandProfile } from '@/lib/brandkit';
import { AD_PLATFORM_LABELS, AD_OBJECTIVE_LABELS, AD_STATUS_LABELS, adStatusVariant } from '@/lib/ads-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { AdCampaignEditor } from '@/components/app/AdCampaignEditor';
import { AdCreativeManager } from '@/components/app/AdCreativeManager';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ id: string }> };

const refId = (v: unknown): string | number | null => (v == null ? null : (typeof v === 'object' ? ((v as { id?: string | number }).id ?? null) : (v as string | number)));

export default async function EditCampaign({ params }: Args) {
  const { id } = await params;
  const ws = await requireWorkspace();
  const doc = await getWorkspaceCampaign(ws.scope, id);
  if (!doc) notFound();
  const d = doc!;
  const editable = canWrite(ws.role);
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [products, requests, landingPages, socialPosts, creatives, brandDoc] = await Promise.all([
    listProductOptions(ws.scope), listRequestOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug),
    listSocialPostOptions(ws.scope), listCampaignCreatives(ws.scope, d.id as string | number), getBrandProfile(ws.scope),
  ]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    targetAudience: (brandDoc.targetAudience as string) || '', accentColor: (brandDoc.accentColor as string) || '',
    affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;

  const str = (k: string) => (d[k] as string) || '';
  const campaign = {
    id: d.id as string | number, name: str('name'), platform: String(d.platform || 'generic'), objective: String(d.objective || 'generic'),
    status: String(d.status || 'draft'), audienceName: str('audienceName'), audienceNotes: str('audienceNotes'),
    geographyNotes: str('geographyNotes'), languageNotes: str('languageNotes'), placementNotes: str('placementNotes'),
    budgetNotes: str('budgetNotes'), scheduleNotes: str('scheduleNotes'), primaryCTA: str('primaryCTA'), destinationURL: str('destinationURL'),
    utmSource: str('utmSource'), utmMedium: str('utmMedium'), utmCampaign: str('utmCampaign'), utmContent: str('utmContent'), utmTerm: str('utmTerm'),
    disclosureText: str('disclosureText'), notes: str('notes'), exportCount: Number(d.exportCount || 0),
    relatedProduct: refId(d.relatedProduct), relatedRequest: refId(d.relatedRequest),
    relatedLandingPage: refId(d.relatedLandingPage), relatedSocialPost: refId(d.relatedSocialPost),
  };
  const creativeList = creatives.map((c) => ({
    id: c.id as string | number, name: (c.name as string) || '', platform: String(c.platform || 'generic'), format: String(c.format || 'text_ad'),
    status: String(c.status || 'draft'), headline: (c.headline as string) || '', primaryText: (c.primaryText as string) || '',
    description: (c.description as string) || '', ctaLabel: (c.ctaLabel as string) || '', ctaUrl: (c.ctaUrl as string) || '',
    displayPath: (c.displayPath as string) || '', keywords: (c.keywords as string) || '', creativeNotes: (c.creativeNotes as string) || '',
    disclosureText: (c.disclosureText as string) || '', relatedSocialPost: refId(c.relatedSocialPost), relatedLandingPage: refId(c.relatedLandingPage),
  }));

  return (
    <>
      <TopBar
        title={campaign.name || 'Ad campaign'}
        sub={<>{AD_PLATFORM_LABELS[campaign.platform] || campaign.platform} · {AD_OBJECTIVE_LABELS[campaign.objective] || campaign.objective} · {AD_STATUS_LABELS[campaign.status] || campaign.status}</>}
        actions={<WsLink href="/app/ads">Back to list</WsLink>}
      />
      <div className="adm-content">
        {editable ? (
          <>
            <AdCampaignEditor campaign={campaign} products={products} requests={requests} landingPages={landingPages} socialPosts={socialPosts} brand={brand} brandProfileId={brandDoc?.id ?? null} />
            <AdCreativeManager campaignId={campaign.id} creatives={creativeList} socialPosts={socialPosts} landingPages={landingPages} />
          </>
        ) : (
          <Card>
            <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${adStatusVariant(campaign.status)}`}>{AD_STATUS_LABELS[campaign.status] || campaign.status}</span></div>
            <div className="adm-row"><span className="t">Platform</span><strong>{AD_PLATFORM_LABELS[campaign.platform] || campaign.platform}</strong></div>
            <div className="adm-row"><span className="t">Creatives</span><strong>{creativeList.length}</strong></div>
            <p className="adm-note" style={{ marginTop: 8 }}>Your role has read-only access. Ask an owner, admin, or editor to make changes.</p>
          </Card>
        )}
      </div>
    </>
  );
}
