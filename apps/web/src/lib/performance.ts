import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';
import { computeMetrics } from './performance-constants';
import { landingViewTotals } from './landing';

/**
 * Performance data layer (Phase 28). All reads workspace-scoped. Aggregates are
 * computed from MANUALLY entered/imported rows only — never synced or invented.
 */
export async function listWorkspaceEntries(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'performance-entries', { sort: '-entryDate', limit: 500, depth: 0 });
}

export async function getWorkspaceEntry(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'performance-entries', limit: 1, depth: 1, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null;
}

type RelColl = 'ad-campaigns' | 'ad-creatives' | 'landing-pages' | 'social-studio-posts' | 'products' | 'product-requests' | 'articles';

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

export type Opt = { id: string | number; label: string };
const opt = (docs: Doc[], pick: (d: Doc) => string): Opt[] => docs.map((d) => ({ id: d.id as string | number, label: pick(d) }));

export async function listAdCampaignOptions(scope: WorkspaceScope): Promise<Opt[]> {
  return opt(await wsList(scope, 'ad-campaigns', { sort: '-updatedAt', limit: 300, depth: 0 }), (d) => String(d.name ?? `Campaign ${d.id}`));
}
export async function listAdCreativeOptions(scope: WorkspaceScope): Promise<Opt[]> {
  return opt(await wsList(scope, 'ad-creatives', { sort: '-updatedAt', limit: 300, depth: 0 }), (d) => String(d.name ?? `Creative ${d.id}`));
}
export async function listArticleOptions(scope: WorkspaceScope): Promise<Opt[]> {
  return opt(await wsList(scope, 'articles', { sort: '-createdAt', limit: 300, depth: 0 }), (d) => String(d.title ?? `Article ${d.id}`));
}

/** Find a landing page in the workspace by slug (for CSV import mapping). */
export async function landingPageIdBySlug(scope: WorkspaceScope, slug: string): Promise<string | number | null> {
  if (!slug || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'landing-pages', limit: 1, depth: 0, overrideAccess: true,
    where: { and: [{ slug: { equals: slug } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return (r.docs[0]?.id as string | number) ?? null;
}

const refId = (v: unknown): string => (v == null ? '' : String(typeof v === 'object' ? (v as { id?: unknown }).id : v));

/** Aggregate overview: totals + averages + top campaigns/landing/products + internal LP views. */
export async function performanceOverview(scope: WorkspaceScope) {
  const entries = (await listWorkspaceEntries(scope)).filter((e) => String(e.status) !== 'archived');
  const totals = { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, leads: 0, orders: 0 };
  for (const e of entries) {
    totals.impressions += Number(e.impressions || 0); totals.clicks += Number(e.clicks || 0); totals.spend += Number(e.spend || 0);
    totals.conversions += Number(e.conversions || 0); totals.revenue += Number(e.revenue || 0); totals.leads += Number(e.leads || 0); totals.orders += Number(e.orders || 0);
  }
  const averages = computeMetrics(totals);

  // Group helper → { key, label, clicks, spend, revenue }
  function group(keyOf: (e: Doc) => string, labelOf: (e: Doc) => string) {
    const m = new Map<string, { label: string; clicks: number; spend: number; revenue: number; conversions: number }>();
    for (const e of entries) {
      const k = keyOf(e); if (!k) continue;
      const cur = m.get(k) || { label: labelOf(e), clicks: 0, spend: 0, revenue: 0, conversions: 0 };
      cur.clicks += Number(e.clicks || 0); cur.spend += Number(e.spend || 0); cur.revenue += Number(e.revenue || 0); cur.conversions += Number(e.conversions || 0);
      m.set(k, cur);
    }
    return [...m.values()].map((g) => ({ ...g, roas: g.spend > 0 ? g.revenue / g.spend : null })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  }
  const topCampaigns = group(
    (e) => refId(e.relatedAdCampaign) || (e.campaignName ? `name:${String(e.campaignName)}` : ''),
    (e) => String(e.campaignName || (e.relatedAdCampaign && typeof e.relatedAdCampaign === 'object' ? (e.relatedAdCampaign as Doc).name : '') || 'Campaign'),
  );
  const topProducts = group((e) => refId(e.relatedProduct), (e) => String((e.relatedProduct && typeof e.relatedProduct === 'object' ? (e.relatedProduct as Doc).name : '') || 'Product'));

  // Internal landing-page views (Phase 24) — kept SEPARATE from manual ad clicks.
  const lpViews = await landingViewTotals(scope);
  const lpViewTotal = Object.values(lpViews).reduce((a, b) => a + Number(b || 0), 0);
  const lpEntries = group((e) => refId(e.relatedLandingPage), (e) => String((e.relatedLandingPage && typeof e.relatedLandingPage === 'object' ? (e.relatedLandingPage as Doc).title : '') || 'Landing page'));

  return { count: entries.length, totals, averages, topCampaigns, topProducts, lpEntries, lpViewTotal };
}
