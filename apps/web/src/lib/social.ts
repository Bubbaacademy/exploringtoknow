import { getPayload } from 'payload';
import config from '@payload-config';
import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';
import { isSafeHttpUrl } from './social-constants';

/**
 * Social Studio data layer (Phase 25). Console reads are workspace-scoped via wsList
 * (server-derived tenant/workspace `where`) — a member with no resolvable workspace
 * matches nothing. Manual authoring only; no platform/AI/external calls anywhere.
 */
export async function listWorkspaceSocialPosts(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'social-studio-posts', { sort: '-updatedAt', limit: 200, depth: 0 });
}

/** A single social post IN the actor's workspace (scoped — null if not theirs). */
export async function getWorkspaceSocialPost(scope: WorkspaceScope, id: string | number): Promise<Doc | null> {
  if (scope.tenantId == null || scope.workspaceId == null) return null;
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'social-studio-posts', limit: 1, depth: 1, overrideAccess: true,
    where: { and: [{ id: { equals: id as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs[0] ?? null;
}

export type RelOption = { id: string | number; label: string; url: string };

/** Workspace landing pages for the editor picker. Public URL is absolute + only for PUBLISHED pages. */
export async function listLandingPageOptions(scope: WorkspaceScope, workspaceSlug?: string): Promise<RelOption[]> {
  const docs = await wsList(scope, 'landing-pages', { sort: '-updatedAt', limit: 200, depth: 0 });
  const base = (process.env.PAYLOAD_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
  return docs.map((p) => {
    const published = String(p.status) === 'published' && p.slug && workspaceSlug;
    const url = published && base ? `${base}/lp/${workspaceSlug}/${String(p.slug)}` : '';
    return {
      id: p.id as string | number,
      label: `${String(p.title ?? `Page ${p.id}`)}${published ? '' : ' (not published)'}`,
      url: isSafeHttpUrl(url) ? url : '',
    };
  });
}

type RelColl = 'products' | 'product-requests' | 'landing-pages' | 'brand-profiles' | 'social-studio-posts';

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

/** Is `userId` a member of the actor's workspace? (assignee verification) */
export async function userIsWorkspaceMember(scope: WorkspaceScope, userId: unknown): Promise<boolean> {
  if (userId == null || scope.workspaceId == null) return false;
  const payload = await getPayload({ config });
  const r = await payload.count({
    collection: 'memberships',
    where: { and: [{ user: { equals: userId as never } }, { workspace: { equals: scope.workspaceId } }] },
    overrideAccess: true,
  });
  return r.totalDocs > 0;
}

/** Workspace members for the assignee picker (id + label). */
export async function listAssigneeOptions(scope: WorkspaceScope): Promise<Array<{ id: string | number; label: string }>> {
  const members = await wsList(scope, 'memberships', { sort: 'createdAt', limit: 200, depth: 1 });
  const seen = new Set<string>();
  const out: Array<{ id: string | number; label: string }> = [];
  for (const m of members) {
    const u = m.user;
    if (!u || typeof u !== 'object') continue;
    const id = (u as Doc).id as string | number;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id, label: String((u as Doc).fullName || (u as Doc).email || `User ${id}`) });
  }
  return out;
}

/** Social posts by id that belong to the actor's workspace (for bulk export / duplication). */
export async function getSocialPostsByIds(scope: WorkspaceScope, ids: Array<string | number>): Promise<Doc[]> {
  if (!ids.length || scope.tenantId == null || scope.workspaceId == null) return [];
  const payload = await getPayload({ config });
  const r = await payload.find({
    collection: 'social-studio-posts', limit: 500, depth: 1, pagination: false, overrideAccess: true,
    where: { and: [{ id: { in: ids as never } }, { tenant: { equals: scope.tenantId } }, { workspace: { equals: scope.workspaceId } }] },
  });
  return r.docs as Doc[];
}

/** Social Studio overview counts (status buckets + planning + export totals), workspace-scoped. */
export async function socialOverview(scope: WorkspaceScope): Promise<{
  total: number; draft: number; ready: number; approved: number; archived: number;
  plannedThisWeek: number; exported: number;
}> {
  const posts = await listWorkspaceSocialPosts(scope);
  const today = new Date();
  // UTC week window [today, today+7) using YYYY-MM-DD string comparison.
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 7 * 86400000);
  const end = endDate.toISOString().slice(0, 10);
  let draft = 0, ready = 0, approved = 0, archived = 0, plannedThisWeek = 0, exported = 0;
  for (const p of posts) {
    const s = String(p.status);
    if (s === 'draft') draft++;
    else if (s === 'ready_for_review') ready++;
    else if (s === 'approved_to_copy') approved++;
    else if (s === 'archived') archived++;
    const pd = typeof p.plannedDate === 'string' ? p.plannedDate : '';
    if (pd && pd >= start && pd < end) plannedThisWeek++;
    if (Number(p.exportCount || 0) > 0) exported++;
  }
  return { total: posts.length, draft, ready, approved, archived, plannedThisWeek, exported };
}
