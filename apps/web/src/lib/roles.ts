import type { Role } from './tenant';

/**
 * Workspace role → capability map (Phase 18). UI uses these to show/hide actions;
 * server routes re-check them. Platform super admin is NOT a workspace role and is
 * never assignable here.
 */
export const isOwner = (r: Role | null | undefined): boolean => r === 'workspace_owner';
export const isViewer = (r: Role | null | undefined): boolean => r === 'viewer';

/** Create/edit/upload (products, requests, media). Everyone except viewer. */
export const canWrite = (r: Role | null | undefined): boolean =>
  r === 'workspace_owner' || r === 'workspace_admin' || r === 'editor';

/** Manage team (invite / change role / remove). Owner only in this phase. */
export const canManageTeam = (r: Role | null | undefined): boolean => r === 'workspace_owner';

/** Manage sensitive workspace settings. Owner only. */
export const canManageSettings = (r: Role | null | undefined): boolean => r === 'workspace_owner';

/** Manage the workspace brand kit + asset library. Owner or workspace admin. */
export const canManageBrand = (r: Role | null | undefined): boolean =>
  r === 'workspace_owner' || r === 'workspace_admin';

/**
 * Connect/disconnect/sync provider connections (OAuth vault). Owner or workspace admin —
 * plus the platform super admin, who has full SaaS authority and manages connections on
 * their own (scoped) workspace. Editors/viewers remain read-only. Scope is always derived
 * from the actor's membership, so this never widens tenant access.
 */
export const canManageConnections = (r: Role | null | undefined): boolean =>
  r === 'workspace_owner' || r === 'workspace_admin' || r === 'platform_super_admin';

/** Roles an owner may assign to a teammate (never owner/super-admin). */
export const INVITABLE_ROLES: ReadonlyArray<Exclude<Role, 'workspace_owner' | 'platform_super_admin'>> = [
  'workspace_admin', 'editor', 'viewer',
];

export const isInvitableRole = (r: string): r is Role =>
  (INVITABLE_ROLES as readonly string[]).includes(r);

/** Short role labels (safe to import in client components — no server deps). */
export const ROLE_LABELS: Record<string, string> = {
  platform_super_admin: 'Platform super admin',
  workspace_owner: 'Owner',
  workspace_admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};
