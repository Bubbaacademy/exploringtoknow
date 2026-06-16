import type { Access, CollectionBeforeChangeHook, PayloadRequest, Where } from 'payload';

/**
 * Phase 14 — TRUE server-side multi-tenant access control.
 *
 * These run inside Payload's access/hook context (admin UI + native REST/GraphQL,
 * where overrideAccess is false). Public site reads and the worker use the Local
 * API with overrideAccess=true and therefore bypass these — that is intentional:
 * the public published-only gate lives in lib/public.ts, and the worker is trusted
 * system context. The functions below scope the operator/customer surfaces so a
 * workspace user can never read or mutate another tenant's data.
 *
 * The actor's tenant/role is derived from their Memberships (resolved server-side),
 * NEVER from client-submitted tenant/workspace/role values.
 */

type Id = number | string;

export type ActorScope = {
  userId: Id | null;
  isSuper: boolean;
  tenantIds: Id[];
  workspaceIds: Id[];
  primaryTenantId: Id | null;
  primaryWorkspaceId: Id | null;
};

const EMPTY_SCOPE: ActorScope = {
  userId: null, isSuper: false, tenantIds: [], workspaceIds: [],
  primaryTenantId: null, primaryWorkspaceId: null,
};

const refId = (v: unknown): Id | null =>
  v == null ? null : (typeof v === 'object' ? ((v as { id?: Id }).id ?? null) : (v as Id));

const ROLE_RANK: Record<string, number> = {
  workspace_owner: 0, workspace_admin: 1, platform_super_admin: 2, editor: 3, viewer: 4,
};

/**
 * Resolve the authenticated actor's scope from their memberships. Memberships are
 * read with overrideAccess=true (server-trusted, filtered by the session user id)
 * so this never recurses through the memberships access rules.
 */
export async function getActorScope(req: PayloadRequest): Promise<ActorScope> {
  const user = req?.user as { id?: Id } | undefined | null;
  if (!user?.id) return EMPTY_SCOPE;
  let docs: Array<Record<string, any>> = [];
  try {
    const res = await req.payload.find({
      collection: 'memberships',
      where: { user: { equals: user.id } },
      depth: 0, limit: 500, pagination: false, overrideAccess: true, req,
    });
    docs = res.docs as Array<Record<string, any>>;
  } catch {
    docs = [];
  }
  const isSuper = docs.some((d) => d.role === 'platform_super_admin');
  const tenantIds = [...new Set(docs.map((d) => refId(d.tenant)).filter((v): v is Id => v != null))];
  const workspaceIds = [...new Set(docs.map((d) => refId(d.workspace)).filter((v): v is Id => v != null))];
  const withTenant = docs
    .filter((d) => refId(d.tenant) != null)
    .sort((a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9));
  const primary = withTenant[0];
  return {
    userId: user.id,
    isSuper,
    tenantIds,
    workspaceIds,
    primaryTenantId: primary ? refId(primary.tenant) : (tenantIds[0] ?? null),
    primaryWorkspaceId: primary ? refId(primary.workspace) : (workspaceIds[0] ?? null),
  };
}

export type AnonPolicy = 'public' | 'published' | 'deny';

/**
 * READ scope for a tenant-scoped collection.
 * super → all · authed member → only their tenant(s) · anonymous → per policy
 * ('public' keeps it openly readable, 'published' restricts to published articles,
 * 'deny' blocks it). Public site rendering is unaffected (Local API overrides access).
 */
export const scopedRead = (anon: AnonPolicy = 'deny'): Access =>
  async ({ req }) => {
    const s = await getActorScope(req);
    if (s.isSuper) return true;
    if (s.userId) {
      if (!s.tenantIds.length) return false;
      return { tenant: { in: s.tenantIds } } as Where;
    }
    if (anon === 'public') return true;
    if (anon === 'published') return { editorialStatus: { equals: 'published' } } as Where;
    return false;
  };

/** UPDATE/DELETE scope: super → all · authed member → only their tenant · else → deny. */
export const scopedMutate = (): Access =>
  async ({ req }) => {
    const s = await getActorScope(req);
    if (s.isSuper) return true;
    if (s.userId && s.tenantIds.length) return { tenant: { in: s.tenantIds } } as Where;
    return false;
  };

/**
 * CREATE scope: super → yes · authed member with a tenant → yes · else → no.
 * (Public intake — newsletter/contact/product-request/track — creates via the Local
 * API with overrideAccess and is unaffected; the stamp hook assigns its tenant.)
 */
export const scopedCreate = (): Access =>
  async ({ req }) => {
    const s = await getActorScope(req);
    if (s.isSuper) return true;
    return Boolean(s.userId && s.tenantIds.length);
  };

// ---- Platform collections (tenants / workspaces / memberships / users) ----

/** Tenants: super → all; member → only their own tenant rows; anon → deny. */
export const tenantsRead: Access = async ({ req }) => {
  const s = await getActorScope(req);
  if (s.isSuper) return true;
  if (s.userId && s.tenantIds.length) return { id: { in: s.tenantIds } } as Where;
  return false;
};

/** Workspaces: super → all; member → workspaces under their tenant(s); anon → deny. */
export const workspacesRead: Access = async ({ req }) => {
  const s = await getActorScope(req);
  if (s.isSuper) return true;
  if (s.userId && s.tenantIds.length) return { tenant: { in: s.tenantIds } } as Where;
  return false;
};

/** Memberships: super → all; member → only their own memberships; anon → deny. */
export const membershipsRead: Access = async ({ req }) => {
  const s = await getActorScope(req);
  if (s.isSuper) return true;
  if (s.userId) return { user: { equals: s.userId } } as Where;
  return false;
};

/** Platform objects may only be mutated by a platform super admin. */
export const superOnly: Access = async ({ req }) => {
  const s = await getActorScope(req);
  return s.isSuper;
};

/** Users: super → all; otherwise only the user themselves. */
export const usersRead: Access = async ({ req }) => {
  const s = await getActorScope(req);
  if (s.isSuper) return true;
  if (s.userId) return { id: { equals: s.userId } } as Where;
  return false;
};

/** Users mutate: super → all; otherwise only self (account management). */
export const usersSelfOrSuper: Access = async ({ req }) => {
  const s = await getActorScope(req);
  if (s.isSuper) return true;
  if (s.userId) return { id: { equals: s.userId } } as Where;
  return false;
};

/**
 * Admin-panel gate (Payload `access.admin` on the auth collection).
 * Platform super admins only. Legacy operators with the `role: 'admin'` flag keep
 * access as a transitional fallback (prevents lockout of pre-membership operators).
 * Workspace customers are blocked here and belong in /app.
 */
export const adminPanelAccess = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  const user = req?.user as { id?: Id; role?: string } | undefined | null;
  if (!user?.id) return false;
  if (user.role === 'admin') return true;
  const s = await getActorScope(req);
  return s.isSuper;
};

// ---- Tenant/Workspace stamping (never trust client-submitted ids) ----

let cachedEtk: { tenantId: Id; workspaceId: Id } | null = null;

async function etkDefaults(req: PayloadRequest): Promise<{ tenantId: Id | null; workspaceId: Id | null }> {
  if (cachedEtk) return cachedEtk;
  try {
    const [t, w] = await Promise.all([
      req.payload.find({ collection: 'tenants', where: { slug: { equals: 'exploringtoknow' } }, limit: 1, depth: 0, overrideAccess: true, req }),
      req.payload.find({ collection: 'workspaces', where: { slug: { equals: 'exploringtoknow' } }, limit: 1, depth: 0, overrideAccess: true, req }),
    ]);
    const tenantId = (t.docs[0]?.id as Id) ?? null;
    const workspaceId = (w.docs[0]?.id as Id) ?? null;
    if (tenantId != null && workspaceId != null) cachedEtk = { tenantId, workspaceId };
    return { tenantId, workspaceId };
  } catch {
    return { tenantId: null, workspaceId: null };
  }
}

/**
 * beforeChange hook for every tenant/workspace-scoped collection.
 * - Authed non-super user: tenant + workspace are FORCED to the actor's own
 *   (client-submitted values are ignored — no cross-tenant writes).
 * - Super admin / system (worker, Local API): explicit values are respected; on
 *   create, unset tenant/workspace default to the ExploringToKnow workspace so new
 *   records are never left unscoped.
 */
export const stampTenantWorkspace: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const s = await getActorScope(req);
  if (s.userId && !s.isSuper) {
    if (s.primaryTenantId != null) (data as Record<string, unknown>).tenant = s.primaryTenantId;
    if (s.primaryWorkspaceId != null) (data as Record<string, unknown>).workspace = s.primaryWorkspaceId;
    return data;
  }
  if (operation === 'create') {
    const d = data as Record<string, unknown>;
    if (d.tenant == null || d.workspace == null) {
      const def = await etkDefaults(req);
      if (d.tenant == null && def.tenantId != null) d.tenant = def.tenantId;
      if (d.workspace == null && def.workspaceId != null) d.workspace = def.workspaceId;
    }
  }
  return data;
};
