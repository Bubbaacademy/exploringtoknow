import { notFound } from 'next/navigation';
import { requireWorkspace } from '@/lib/workspace';
import { canWrite } from '@/lib/roles';
import { getWorkspaceEntry, listAdCampaignOptions, listAdCreativeOptions, listArticleOptions } from '@/lib/performance';
import { listProductOptions, listRequestOptions } from '@/lib/landing';
import { listLandingPageOptions } from '@/lib/social';
import { listSocialPostOptions } from '@/lib/ads';
import { PERF_PLATFORM_LABELS, PERF_CHANNEL_LABELS, PERF_STATUS_LABELS, perfStatusVariant } from '@/lib/performance-constants';
import { TopBar, Card, WsLink } from '../../_ui';
import { PerfNav } from '../_nav';
import { PerformanceEntryEditor } from '@/components/app/PerformanceEntryEditor';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ id: string }> };

const refId = (v: unknown): string | number | null => (v == null ? null : (typeof v === 'object' ? ((v as { id?: string | number }).id ?? null) : (v as string | number)));

export default async function EditPerformanceEntry({ params }: Args) {
  const { id } = await params;
  const ws = await requireWorkspace();
  const doc = await getWorkspaceEntry(ws.scope, id);
  if (!doc) notFound();
  const d = doc!;
  const editable = canWrite(ws.role);
  const wsSlug = (ws.workspace?.slug as string) || undefined;
  const [adCampaigns, adCreatives, landingPages, socialPosts, products, requests, articles] = await Promise.all([
    listAdCampaignOptions(ws.scope), listAdCreativeOptions(ws.scope), listLandingPageOptions(ws.scope, wsSlug),
    listSocialPostOptions(ws.scope), listProductOptions(ws.scope), listRequestOptions(ws.scope), listArticleOptions(ws.scope),
  ]);
  const n = (k: string) => Number(d[k] || 0);
  const s = (k: string) => (d[k] as string) || '';
  const entry = {
    id: d.id as string | number, platform: String(d.platform || 'generic'), channelType: String(d.channelType || 'generic'), status: String(d.status || 'recorded'),
    entryDate: s('entryDate'), entryDateEnd: s('entryDateEnd'), campaignName: s('campaignName'), adSetName: s('adSetName'), creativeName: s('creativeName'),
    currency: s('currency') || 'USD', notes: s('notes'),
    impressions: n('impressions'), clicks: n('clicks'), spend: n('spend'), conversions: n('conversions'), orders: n('orders'), revenue: n('revenue'), leads: n('leads'), addToCart: n('addToCart'),
    relatedAdCampaign: refId(d.relatedAdCampaign), relatedAdCreative: refId(d.relatedAdCreative), relatedLandingPage: refId(d.relatedLandingPage),
    relatedSocialPost: refId(d.relatedSocialPost), relatedProduct: refId(d.relatedProduct), relatedRequest: refId(d.relatedRequest), relatedArticle: refId(d.relatedArticle),
  };

  return (
    <>
      <TopBar
        title={entry.campaignName || 'Performance entry'}
        sub={<>{PERF_PLATFORM_LABELS[entry.platform] || entry.platform} · {PERF_CHANNEL_LABELS[entry.channelType] || entry.channelType} · {PERF_STATUS_LABELS[entry.status] || entry.status}</>}
        actions={<WsLink href="/app/performance">Back</WsLink>}
      />
      <div className="adm-content">
        <PerfNav active="/app/performance" />
        {editable ? (
          <PerformanceEntryEditor entry={entry} pickers={{ adCampaigns, adCreatives, landingPages, socialPosts, products, requests, articles }} />
        ) : (
          <Card>
            <div className="adm-row"><span className="t">Status</span><span className={`adm-badge ${perfStatusVariant(entry.status)}`}>{PERF_STATUS_LABELS[entry.status] || entry.status}</span></div>
            <div className="adm-row"><span className="t">Spend / Revenue</span><strong>{entry.spend} / {entry.revenue} {entry.currency}</strong></div>
            <p className="adm-note" style={{ marginTop: 8 }}>Your role has read-only access. Ask an owner, admin, or editor to make changes.</p>
          </Card>
        )}
      </div>
    </>
  );
}
