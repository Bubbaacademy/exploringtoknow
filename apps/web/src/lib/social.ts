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

type RelColl = 'products' | 'product-requests' | 'landing-pages' | 'brand-profiles';

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
