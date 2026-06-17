import { getPayload } from 'payload';
import config from '@payload-config';
import { redirect } from 'next/navigation';
import {
  getTenantContext, getPrimaryTenant, getPrimaryWorkspace, getPrimaryMembership,
  type TenantContext, type Doc, type Role,
} from './tenant';

/**
 * Workspace console data layer (Phase 16). EVERY read is scoped to the actor's
 * tenant + workspace, derived SERVER-SIDE from their membership — client-submitted
 * tenant/workspace ids are never trusted. Uses the Local API with an explicit
 * tenant/workspace `where` (the same server-scoping pattern as /platform). A member
 * with no resolvable tenant matches NOTHING (never leaks ETK/global data).
 */

export type Id = string | number;
export type WorkspaceScope = { tenantId: Id | null; workspaceId: Id | null };
export type WorkspaceSession = {
  ctx: TenantContext;
  tenant: Doc | null;
  workspace: Doc | null;
  role: Role | null;
  isSuper: boolean;
  scope: WorkspaceScope;
};

/** Resolve the current workspace session WITHOUT redirecting (for API routes). */
export async function resolveWorkspace(): Promise<WorkspaceSession> {
  const ctx = await getTenantContext();
  const tenant = getPrimaryTenant(ctx);
  const workspace = getPrimaryWorkspace(ctx);
  const role = getPrimaryMembership(ctx)?.role ?? null;
  return {
    ctx, tenant, workspace, role, isSuper: ctx.isSuperAdmin,
    scope: { tenantId: tenant?.id ?? null, workspaceId: workspace?.id ?? null },
  };
}

/** Resolve the signed-in workspace session, or redirect to /login (for pages). */
export async function requireWorkspace(): Promise<WorkspaceSession> {
  const ws = await resolveWorkspace();
  if (!ws.ctx.user) redirect('/login');
  return ws;
}

const client = () => getPayload({ config });

/** Build a tenant/workspace-scoped Where. No scope → match nothing (no leak). */
function scoped(scope: WorkspaceScope, extra?: Doc): Doc {
  const and: Doc[] = [];
  if (scope.tenantId != null) and.push({ tenant: { equals: scope.tenantId } });
  if (scope.workspaceId != null) and.push({ workspace: { equals: scope.workspaceId } });
  if (!and.length) and.push({ id: { equals: 0 } }); // unscoped actor → empty, never global
  if (extra) and.push(extra);
  return { and };
}

export async function wsCount(scope: WorkspaceScope, collection: string, extra?: Doc): Promise<number> {
  const p = await client();
  const r = await p.count({ collection: collection as never, where: scoped(scope, extra) });
  return r.totalDocs;
}

export async function wsList(
  scope: WorkspaceScope, collection: string,
  opts: { sort?: string; limit?: number; depth?: number; extra?: Doc } = {},
): Promise<Doc[]> {
  const p = await client();
  const r = await p.find({
    collection: collection as never,
    where: scoped(scope, opts.extra),
    sort: opts.sort, limit: opts.limit ?? 25, depth: opts.depth ?? 0, pagination: false,
  });
  return r.docs as Doc[];
}

/** Counts for the console overview + sidebar. */
export async function workspaceCounts(scope: WorkspaceScope) {
  const [
    published, review, drafts, articlesTotal, products, categories, authors,
    requestsOpen, requestsTotal, subsActive, subsTotal, contactsNew, contactsTotal,
    media, viewRows, runs,
  ] = await Promise.all([
    wsCount(scope, 'articles', { editorialStatus: { equals: 'published' } }),
    wsCount(scope, 'articles', { editorialStatus: { equals: 'ready_for_review' } }),
    wsCount(scope, 'articles', { editorialStatus: { equals: 'draft' } }),
    wsCount(scope, 'articles'),
    wsCount(scope, 'products'),
    wsCount(scope, 'categories'),
    wsCount(scope, 'authors'),
    wsCount(scope, 'product-requests', { status: { in: ['submitted', 'under_review'] } }),
    wsCount(scope, 'product-requests'),
    wsCount(scope, 'newsletter-subscribers', { status: { equals: 'active' } }),
    wsCount(scope, 'newsletter-subscribers'),
    wsCount(scope, 'contact-messages', { status: { equals: 'new' } }),
    wsCount(scope, 'contact-messages'),
    wsCount(scope, 'media'),
    wsCount(scope, 'article-views'),
    wsCount(scope, 'generation-runs'),
  ]);
  return {
    published, review, drafts, articlesTotal, products, categories, authors,
    requestsOpen, requestsTotal, subsActive, subsTotal, contactsNew, contactsTotal,
    media, viewRows, runs,
  };
}

/** Full dashboard payload: counts + needs-attention + recent activity. */
export async function workspaceDashboard(scope: WorkspaceScope) {
  const counts = await workspaceCounts(scope);
  const [pubNoCat, reviewNoCat, recentArticles, recentRequests, recentContacts] = await Promise.all([
    wsCount(scope, 'articles', { and: [{ editorialStatus: { equals: 'published' } }, { category: { exists: false } }] }),
    wsCount(scope, 'articles', { and: [{ editorialStatus: { equals: 'ready_for_review' } }, { category: { exists: false } }] }),
    wsList(scope, 'articles', { sort: '-createdAt', limit: 5, depth: 1 }),
    wsList(scope, 'product-requests', { sort: '-createdAt', limit: 5 }),
    wsList(scope, 'contact-messages', { sort: '-createdAt', limit: 5 }),
  ]);

  const needs: Array<[string, number]> = [];
  if (pubNoCat > 0) needs.push(['Published articles without a category', pubNoCat]);
  if (reviewNoCat > 0) needs.push(['Ready-for-review without a category (blocks publish)', reviewNoCat]);
  if (counts.requestsOpen > 0) needs.push(['Product requests waiting for review', counts.requestsOpen]);
  if (counts.review > 0) needs.push(['Drafts ready for your review', counts.review]);
  if (counts.contactsNew > 0) needs.push(['New contact messages', counts.contactsNew]);

  const isEmpty =
    counts.articlesTotal === 0 && counts.products === 0 && counts.requestsTotal === 0;

  return { counts, needs, recentArticles, recentRequests, recentContacts, isEmpty };
}

/** Members of the actor's workspace (depth 1 → user populated). */
export async function listWorkspaceMembers(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'memberships', { sort: 'createdAt', limit: 200, depth: 1 });
}

/** Pending invitations for the actor's workspace. */
export async function listWorkspaceInvites(scope: WorkspaceScope): Promise<Doc[]> {
  return wsList(scope, 'workspace-invitations', { sort: '-createdAt', limit: 100, depth: 0, extra: { status: { equals: 'pending' } } });
}
