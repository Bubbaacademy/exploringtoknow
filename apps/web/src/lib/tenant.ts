import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * Server-side multi-tenant scoping. The current actor is resolved EXCLUSIVELY from
 * the authenticated Payload session (`payload.auth`) and their Memberships — never
 * from client-submitted tenant/workspace/role values. Every scoped query derives
 * its tenant filter from this context, so isolation is enforced on the server, not
 * in the UI. See collections/Memberships.ts for the authority model.
 */

export type Role =
  | 'platform_super_admin'
  | 'workspace_owner'
  | 'workspace_admin'
  | 'editor'
  | 'viewer';

export type Doc = Record<string, any>;

export type Membership = {
  id: string | number;
  role: Role;
  tenant: Doc | null;
  workspace: Doc | null;
};

export type TenantContext = {
  user: { id: string | number; email?: string; name?: string } | null;
  memberships: Membership[];
  isSuperAdmin: boolean;
};

const ref = (rel: unknown): Doc | null =>
  rel && typeof rel === 'object' ? (rel as Doc) : null;
const refId = (rel: unknown): string | number | null => {
  if (rel == null) return null;
  if (typeof rel === 'object') return (rel as Doc).id ?? null;
  return rel as string | number;
};

/**
 * Resolve the authenticated actor and their memberships. Returns an empty,
 * unprivileged context when there is no valid session — callers gate on it.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const payload = await getPayload({ config });
  let user: TenantContext['user'] = null;
  try {
    const h = await nextHeaders();
    const res = await payload.auth({ headers: h as unknown as Headers });
    user = res.user ? { id: res.user.id, email: (res.user as Doc).email, name: (res.user as Doc).name } : null;
  } catch {
    user = null;
  }
  if (!user) return { user: null, memberships: [], isSuperAdmin: false };

  // Memberships are read by the SERVER using the session user id as the filter —
  // the client cannot influence which memberships are returned.
  const res = await payload.find({
    collection: 'memberships',
    where: { user: { equals: user.id } },
    depth: 1,
    limit: 200,
    pagination: false,
  });
  const memberships: Membership[] = res.docs.map((m: Doc) => ({
    id: m.id,
    role: m.role as Role,
    tenant: ref(m.tenant),
    workspace: ref(m.workspace),
  }));
  const isSuperAdmin = memberships.some((m) => m.role === 'platform_super_admin');
  return { user, memberships, isSuperAdmin };
}

/** Gate a /platform page: must be an authenticated platform super admin. */
export async function requireSuperAdmin(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx.user) redirect('/admin/login');
  if (!ctx.isSuperAdmin) redirect('/app');
  return ctx;
}

/** Gate a /app page: must be an authenticated member of at least one workspace. */
export async function requireWorkspaceMember(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx.user) redirect('/admin/login');
  if (!ctx.memberships.length) redirect('/admin');
  return ctx;
}

const ROLE_RANK: Record<Role, number> = {
  workspace_owner: 0,
  workspace_admin: 1,
  platform_super_admin: 2,
  editor: 3,
  viewer: 4,
};

/** The actor's primary tenant (most privileged membership that carries a tenant). */
export function getPrimaryTenant(ctx: TenantContext): Doc | null {
  const withTenant = ctx.memberships.filter((m) => m.tenant);
  if (!withTenant.length) return null;
  withTenant.sort((a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9));
  return withTenant[0]?.tenant ?? null;
}

/**
 * Tenant-scoped workspace overview. EVERY count is filtered by the supplied
 * tenantId (derived from the session, not the client), demonstrating true
 * server-side scoping rather than UI-only filtering.
 */
export async function getWorkspaceOverview(tenantId: string | number) {
  const payload = await getPayload({ config });
  const scoped = (where: Doc) => ({ and: [{ tenant: { equals: tenantId } }, where] });
  const count = async (collection: string, where: Doc): Promise<number> => {
    const r = await payload.count({ collection: collection as any, where: scoped(where) });
    return r.totalDocs;
  };
  const [
    published, review, drafts, products, categories, authors,
    requestsOpen, subsActive, contactsNew, viewRows,
  ] = await Promise.all([
    count('articles', { editorialStatus: { equals: 'published' } }),
    count('articles', { editorialStatus: { equals: 'ready_for_review' } }),
    count('articles', { editorialStatus: { equals: 'draft' } }),
    count('products', {}),
    count('categories', {}),
    count('authors', {}),
    count('product-requests', { status: { in: ['submitted', 'under_review'] } }),
    count('newsletter-subscribers', { status: { equals: 'active' } }),
    count('contact-messages', { status: { equals: 'new' } }),
    count('article-views', {}),
  ]);
  return { published, review, drafts, products, categories, authors, requestsOpen, subsActive, contactsNew, viewRows };
}

/** Platform-wide overview for the super-admin console (all tenants). */
export async function getPlatformOverview() {
  const payload = await getPayload({ config });
  const count = async (collection: string, where: Doc = {}): Promise<number> => {
    const r = await payload.count({ collection: collection as any, where });
    return r.totalDocs;
  };
  const [tenants, workspaces, memberships, users, articles, products] = await Promise.all([
    count('tenants'),
    count('workspaces'),
    count('memberships'),
    count('users'),
    count('articles'),
    count('products'),
  ]);

  // Per-tenant rollup (small N — tenants are operator-managed accounts).
  const tenantList = await payload.find({ collection: 'tenants', sort: 'slug', limit: 100, pagination: false });
  const workspaceList = await payload.find({ collection: 'workspaces', depth: 1, limit: 500, pagination: false });
  const rows = await Promise.all(
    tenantList.docs.map(async (t: Doc) => {
      const where = { tenant: { equals: t.id } };
      const [pub, prod, wsCount] = await Promise.all([
        count('articles', { and: [where, { editorialStatus: { equals: 'published' } }] }),
        count('products', where),
        Promise.resolve(workspaceList.docs.filter((w: Doc) => refId(w.tenant) === t.id).length),
      ]);
      return { id: t.id, name: t.name as string, slug: t.slug as string, status: String(t.status ?? ''), plan: String(t.plan ?? ''), workspaces: wsCount, published: pub, products: prod };
    }),
  );
  return { totals: { tenants, workspaces, memberships, users, articles, products }, tenants: rows };
}
