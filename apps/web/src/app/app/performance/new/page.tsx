import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { listAdCampaignOptions, listAdCreativeOptions, listArticleOptions } from '@/lib/performance';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { listLandingPageOptions } from '@/lib/social';
import { listSocialPostOptions } from '@/lib/ads';
import { TopBar } from '../../_ui';
import { PerfNav, PerfDisclaimer } from '../_nav';
import { PerformanceEntryEditor } from '@/components/app/PerformanceEntryEditor';

export const dynamic = 'force-dynamic';

export default async function NewPerformanceEntry() {
  const ws = await requireWorkspace();
  if (!canWrite(ws.role)) {
    return (<><TopBar title="New entry" /><div className="adm-content"><div className="adm-panel warn">You don’t have permission to record performance.</div></div></>);
  }
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [adCampaigns, adCreatives, landingPages, socialPosts, products, requests, articles] = await Promise.all([
    listAdCampaignOptions(ws.scope), listAdCreativeOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug),
    listSocialPostOptions(ws.scope), listProductOptions(ws.scope), listRequestOptions(ws.scope), listArticleOptions(ws.scope),
  ]);

  return (
    <>
      <TopBar title="New performance entry" sub="Manual entry. Nothing is synced from any platform." />
      <div className="adm-content">
        <PerfNav active="/app/performance/new" />
        <PerfDisclaimer />
        <PerformanceEntryEditor pickers={{ adCampaigns, adCreatives, landingPages, socialPosts, products, requests, articles }} />
      </div>
    </>
  );
}
