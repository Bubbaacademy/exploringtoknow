import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { listLandingPageOptions } from '@/lib/social';
import { listSocialPostOptions } from '@/lib/ads';
import { getBrandProfile } from '@/lib/brandkit';
import { TopBar } from '../../_ui';
import { AdCampaignEditor } from '@/components/app/AdCampaignEditor';

export const dynamic = 'force-dynamic';

export default async function NewCampaign() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (
      <>
        <TopBar title="New campaign" />
        <div className="adm-content"><div className="adm-panel warn">You don’t have permission to create ad campaigns.</div></div>
      </>
    );
  }
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [products, requests, landingPages, socialPosts, brandDoc] = await Promise.all([
    listProductOptions(ws.scope), listRequestOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug), listSocialPostOptions(ws.scope), getBrandProfile(ws.scope),
  ]);
  const brand = brandDoc ? {
    publicationName: (brandDoc.publicationName as string) || '', brandVoice: (brandDoc.brandVoice as string) || '',
    targetAudience: (brandDoc.targetAudience as string) || '', accentColor: (brandDoc.accentColor as string) || '',
    affiliateDisclosure: (brandDoc.affiliateDisclosure as string) || '',
  } : null;

  return (
    <>
      <TopBar title="New ad campaign" sub="Starts as a draft. Manual planning only — nothing launches or spends." />
      <div className="adm-content">
        <AdCampaignEditor products={products} requests={requests} landingPages={landingPages} socialPosts={socialPosts} brand={brand} brandProfileId={brandDoc?.id ?? null} />
      </div>
    </>
  );
}
