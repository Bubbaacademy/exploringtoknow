import { wsList, type WorkspaceScope } from './workspace';
import type { Doc } from './tenant';

/**
 * Workspace Brand Kit data layer (Phase 22). Distinct from lib/brand.ts (which
 * loads the AI-pipeline brand GLOBAL). Reads here are workspace-scoped via wsList
 * (server-derived tenant/workspace `where`) — a member with no resolvable workspace
 * matches nothing. One brand profile per workspace; many assets.
 */
export async function getBrandProfile(scope: WorkspaceScope): Promise<Doc | null> {
  const docs = await wsList(scope, 'brand-profiles', { sort: '-updatedAt', limit: 1, depth: 0 });
  return docs[0] ?? null;
}

export async function listBrandAssets(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'brand-assets', { sort: '-createdAt', limit: 200, depth: 0 });
}

export const ASSET_TYPES = ['logo', 'brand_image', 'product_image', 'document', 'link', 'other'] as const;
export const ASSET_PERMISSIONS = ['user_provided', 'permission_cleared', 'needs_review', 'unknown'] as const;

export const ASSET_TYPE_LABELS: Record<string, string> = {
  logo: 'Logo', brand_image: 'Brand image', product_image: 'Product image',
  document: 'Document', link: 'Link / reference', other: 'Other',
};
export const ASSET_PERMISSION_LABELS: Record<string, string> = {
  user_provided: 'User-provided', permission_cleared: 'Permission-cleared',
  needs_review: 'Needs review', unknown: 'Unknown',
};
