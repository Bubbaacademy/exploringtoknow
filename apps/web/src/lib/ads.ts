import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';
import { composeSocialText } from './social-constants';
import { buildTrackingUrl, type AdCampaignExport, type AdCreativeRow } from './ads-constants';

/**
 * Ads Studio data layer (Phase 27). All reads workspace-scoped via wsList / explicit
 * tenant+workspace `where`. Manual planning only — no platform/ad/external calls.
 */
export async function listWorkspaceCampaigns(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'ad-campaigns', { sort: '-updatedAt', limit: 200, depth: 0 });
}

export async function getWorkspaceCampaign(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'ad-campaigns', limit: 1, depth: 1, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null;
}

export async function listCampaignCreatives(scope: WorkspaceScope, campaignId: string | number): Promise<Doc[]> {
  if (scope.workspaceId == null) return [];
  return wsList(scope, 'ad-creatives', { sort: 'createdAt', limit: 200, depth: 0, extra: { campaign: { equals: campaignId as never } } });
}

export async function getWorkspaceCreative(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'ad-creatives', limit: 1, depth: 0, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null;
}

type RelColl = 'products' | 'product-requests' | 'landing-pages' | 'brand-profiles' | 'social-studio-posts' | 'ad-campaigns';

/** Is `id` a record in `collection` that belongs to the actor's workspace? */
export async function relationInWorkspace(scope: WorkspaceScope, collection: RelColl, id: unknown): Promise<boolean> {
  if (id == null || scope.tenantId == null || scope.workspaceId == null) return false;
  const payload = await getPayload({ config });
  const r = await payload.count({
    collection,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.totalDocs > 0;
}

/** Workspace Social Studio posts for the picker (id + label + composed text for manual import). */
export async function listSocialPostOptions(scope: WorkspaceScope): Promise<Array<{ id: string | number; label: string; text: string }>> {
  const docs = await wsList(scope, 'social-studio-posts', { sort: '-updatedAt', limit: 200, depth: 0 });
  return docs.map((p) => ({
    id: p.id as string | number,
    label: String(p.name ?? `Post ${p.id}`),
    text: composeSocialText({ hook: p.hook as string, caption: p.caption as string, ctaLabel: p.ctaLabel as string, ctaUrl: p.ctaUrl as string, hashtags: p.hashtags, disclosureText: p.disclosureText as string }),
  }));
}

/** Campaigns by id that belong to the actor's workspace (bulk export). */
export async function getCampaignsByIds(scope: WorkspaceScope, ids: Array<string | number>): Promise<Doc[]> {
  if (!ids.length || scope.tenantId == null || scope.workspaceId == null) return [];
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'ad-campaigns', limit: 200, depth: 1, pagination: false, overrideAccess: true,
    where: { and: [{ id: { in: ids as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs as Doc[];
}

const relLabel = (c: Doc): string => {
  const lp = c.relatedLandingPage; if (lp && typeof lp === 'object') return `Landing: ${String((lp as Doc).title ?? '')}`;
  const p = c.relatedProduct; if (p && typeof p === 'object') return `Product: ${String((p as Doc).name ?? '')}`;
  const r = c.relatedRequest; if (r && typeof r === 'object') return `Request: ${String((r as Doc).productName ?? '')}`;
  return '';
};

/** Assemble the export payload (campaign + its creatives + derived tracking URL). */
export async function buildCampaignExport(scope: WorkspaceScope, campaign: Doc): Promise<AdCampaignExport> {
  const creativesDocs = await listCampaignCreatives(scope, campaign.id as string | number);
  const creatives: AdCreativeRow[] = creativesDocs.map((cr) => ({
    name: String(cr.name ?? ''), platform: String(cr.platform ?? ''), format: String(cr.format ?? ''), status: String(cr.status ?? ''),
    headline: String(cr.headline ?? ''), primaryText: String(cr.primaryText ?? ''), description: String(cr.description ?? ''),
    ctaLabel: String(cr.ctaLabel ?? ''), ctaUrl: String(cr.ctaUrl ?? ''), displayPath: String(cr.displayPath ?? ''),
    keywords: String(cr.keywords ?? ''), disclosureText: String(cr.disclosureText ?? ''),
  }));
  const trackingURL = buildTrackingUrl(campaign.destinationURL, {
    source: campaign.utmSource as string, medium: campaign.utmMedium as string, campaign: campaign.utmCampaign as string,
    content: campaign.utmContent as string, term: campaign.utmTerm as string,
  });
  return {
    name: String(campaign.name ?? ''), platform: String(campaign.platform ?? ''), objective: String(campaign.objective ?? ''), status: String(campaign.status ?? ''),
    audienceName: String(campaign.audienceName ?? ''), audienceNotes: String(campaign.audienceNotes ?? ''), geographyNotes: String(campaign.geographyNotes ?? ''),
    languageNotes: String(campaign.languageNotes ?? ''), placementNotes: String(campaign.placementNotes ?? ''),
    budgetNotes: String(campaign.budgetNotes ?? ''), scheduleNotes: String(campaign.scheduleNotes ?? ''),
    primaryCTA: String(campaign.primaryCTA ?? ''), destinationURL: String(campaign.destinationURL ?? ''), trackingURL,
    disclosureText: String(campaign.disclosureText ?? ''), relatedLabel: relLabel(campaign), creatives,
  };
}
