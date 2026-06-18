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

// Re-export the pure constants so existing server imports of these from '@/lib/brandkit'
// keep working. Client components must import them from '@/lib/brandkit-constants'.
export { ASSET_TYPES, ASSET_PERMISSIONS, ASSET_TYPE_LABELS, ASSET_PERMISSION_LABELS } from './brandkit-constants';
