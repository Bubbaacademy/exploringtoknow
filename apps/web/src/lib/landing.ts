import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';

/**
 * Landing Pages data layer (Phase 23). Console reads are workspace-scoped via
 * wsList (server-derived tenant/workspace `where`). The public reader resolves a
 * workspace by slug then returns ONLY a published page in that workspace — drafts/
 * archived/other-workspace pages are invisible (returns null → 404 at the route).
 */
export async function listWorkspaceLandingPages(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'landing-pages', { sort: '-updatedAt', limit: 200, depth: 0 });
}

/** A single landing page IN the actor's workspace (scoped — null if not theirs). */
export async function getWorkspaceLandingPage(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'landing-pages', limit: 1, depth: 1, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null;
}

/** Is `slug` already used by another landing page in this workspace? */
export async function landingSlugTaken(scope: WorkspaceScope, slug: string, exceptId?: string | number): Promise<boolean> {
  if (scope.workspaceId == null) return false;
  const payload = await getPayload({ config });
  const and: Doc[] = [{ workspace: { equals: scope.workspaceId } }, { slug: { equals: slug } }];
  if (exceptId != null) and.push({ id: { not_equals: exceptId as never } });
  const r = await payload.count({ collection: 'landing-pages', where: { and } });
  return r.totalDocs > 0;
}

/** Workspace products for the editor picker (id + label + safe prefill URL). */
export async function listProductOptions(scope: WorkspaceScope): Promise<Array<{ id: string | number; label: string; url: string }>> {
  const docs = await wsList(scope, 'products', { sort: '-updatedAt', limit: 200, depth: 0 });
  return docs.map((p) => ({
    id: p.id as string | number,
    label: String(p.name ?? p.title ?? `Product ${p.id}`),
    url: String(p.affiliateUrl ?? p.externalUrl ?? ''),
  }));
}

/** Workspace product-requests for the editor picker. */
export async function listRequestOptions(scope: WorkspaceScope): Promise<Array<{ id: string | number; label: string; url: string }>> {
  const docs = await wsList(scope, 'product-requests', { sort: '-createdAt', limit: 200, depth: 0 });
  return docs.map((r) => ({
    id: r.id as string | number,
    label: String(r.productName ?? `Request ${r.id}`),
    url: String(r.affiliateUrl ?? r.productUrl ?? ''),
  }));
}

/** Is `id` a record in `collection` that belongs to the actor's workspace? */
export async function relationInWorkspace(scope: WorkspaceScope, collection: 'products' | 'product-requests', id: unknown): Promise<boolean> {
  if (id == null || scope.tenantId == null || scope.workspaceId == null) return false;
  const payload = await getPayload({ config });
  const r = await payload.count({
    collection,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.totalDocs > 0;
}

/** Total real view counts per landing page in the actor's workspace (summed across days). */
export async function landingViewTotals(scope: WorkspaceScope): Promise<Record<string, number>> {
  if (scope.workspaceId == null) return {};
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'landing-page-views', limit: 5000, depth: 0, pagination: false, overrideAccess: true,
    where: { and: [{ tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  const totals: Record<string, number> = {};
  for (const row of r.docs as Doc[]) {
    const lp = row.landingPage;
    const key = String(lp && typeof lp === 'object' ? (lp as Doc).id : lp);
    totals[key] = (totals[key] || 0) + Number(row.count || 0);
  }
  return totals;
}

/** Public reader: published page in the named workspace + that workspace's brand. */
export async function getPublishedLandingPage(workspaceSlug: string, slug: string): Promise<{ page: Doc; workspace: Doc; brand: Doc | null } | null> {
  const payload = await getPayload({ config });
  const wf = await payload.find({ collection: 'workspaces', where: { slug: { equals: workspaceSlug } }, limit: 1, depth: 0 });
  const workspace = wf.docs[0];
  if (!workspace) return null;
  const lf = await payload.find({
    collection: 'landing-pages', limit: 1, depth: 1,
    where: { and: [{ workspace: { equals: workspace.id } }, { slug: { equals: slug } }, { status: { equals: 'published' } }] },
  });
  const page = lf.docs[0];
  if (!page) return null;
  const bf = await payload.find({ collection: 'brand-profiles', where: { workspace: { equals: workspace.id } }, limit: 1, depth: 0 });
  return { page, workspace, brand: bf.docs[0] ?? null };
}
