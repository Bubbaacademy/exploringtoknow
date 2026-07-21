import Link from 'next/link';
import { client, getAdminOverview, type Doc } from '@/lib/public';
import { MAGAZINE_SECTIONS } from '@/lib/sections';
import {
  Section, Stat, Card, Empty,
  EditorialStatusBadge, PublicStateBadge, EDITORIAL_STATUS_LABEL, ARTICLE_TYPE_LABEL,
} from '../_components';

export const dynamic = 'force-dynamic';

/**
 * ExploringToKnow Editorial Ops (Phase 2H).
 *
 * The operating overview for running the magazine: publishing counts, the recent
 * article queue, the workflow rules, and jump-off points to where work actually
 * happens.
 *
 * This is deliberately NOT an editor. Article body, SEO, images, categories and
 * publication status are edited in Payload `/admin`; this page never writes.
 * Every figure is read live from real records — nothing is fabricated, and thin
 * data shows an honest empty state.
 *
 * Auth: the /dashboard layout gates the whole tree behind `requireSuperAdmin()`
 * and marks it noindex.
 */

const fmtDate = (v: unknown): string => {
  if (!v) return '—';
  try { return new Date(String(v)).toISOString().slice(0, 10); } catch { return '—'; }
};

const catName = (rel: unknown): string => {
  if (rel && typeof rel === 'object') return String((rel as { name?: unknown }).name ?? '—');
  return rel == null ? '—' : String(rel);
};

/**
 * Read-only counts + recent queue. Mirrors the existing lib/public read patterns
 * (literal collection slug, `limit: 0` for a pure count). No writes anywhere.
 */
async function loadEditorialOps() {
  const payload = await client();

  const [overview, rejectedRes, totalRes, recentRes] = await Promise.all([
    getAdminOverview(),
    payload.find({ collection: 'articles', where: { editorialStatus: { equals: 'rejected' } }, limit: 0, depth: 0 }),
    payload.find({ collection: 'articles', limit: 0, depth: 0 }),
    payload.find({ collection: 'articles', sort: '-updatedAt', limit: 10, depth: 1 }),
  ]);

  return {
    overview,
    rejected: rejectedRes.totalDocs,
    total: totalRes.totalDocs,
    recent: recentRes.docs as Doc[],
  };
}

export default async function ContentOpsPage() {
  const { overview, rejected, total, recent } = await loadEditorialOps();
  const c = (k: string): number => overview.counts[k] ?? 0;
  const review = c('review');

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1>Editorial Ops</h1>
          <span className="adm-sub">
            The operating overview for ExploringToKnow magazine — not the editor. Use Payload <b>/admin</b> to edit article
            body, SEO, images, categories and publication status.
          </span>
        </div>
      </div>

      <div className="adm-content">
        {/* ---- Publishing overview ---- */}
        <Section title="Publishing overview">
          <div className="adm-cols">
            <Stat label="Published" value={c('published')} tone="good" />
            <Stat label="In review" value={review} tone={review > 0 ? 'attn' : undefined} />
            <Stat label="Drafts" value={c('drafts')} />
            <Stat label="Rejected" value={rejected} />
            <Stat label="Total articles" value={total} />
            <Stat label="Categories" value={c('categories')} />
            <Stat label="Media" value={c('media')} />
          </div>
        </Section>

        {/* ---- Workflow rules ---- */}
        <Section title="How publishing works">
          <div className="adm-panel">
            <div className="adm-quicklinks" aria-hidden="true">
              <span className="adm-badge warn">1. {EDITORIAL_STATUS_LABEL.draft}</span>
              <span className="adm-badge info">2. {EDITORIAL_STATUS_LABEL.ready_for_review}</span>
              <span className="adm-badge ok">3. {EDITORIAL_STATUS_LABEL.published}</span>
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>
              <b>Draft → In review → Published.</b> Only <b>Published</b> articles appear on the public magazine — public
              visibility is gated on editorial status alone. Publishing is <b>manual and human-reviewed</b>: an editor sets
              the status. AI may assist with drafting, but <b>nothing publishes automatically</b>. A fourth state,{' '}
              <b>{EDITORIAL_STATUS_LABEL.rejected}</b>, marks work that is not going out as-is.
            </p>
          </div>
        </Section>

        {/* ---- Where work happens ---- */}
        <Section title="Where work happens">
          <div className="adm-cols-2">
            <Card title="Edit in Payload /admin">
              <p className="adm-note">
                The real editing surface. Article body, excerpt, slug, SEO, hero image, category and publication status all
                live here. This dashboard is the operating overview, not the editor.
              </p>
              <div className="adm-quicklinks" style={{ marginTop: 10 }}>
                <a className="adm-btn" href="/admin/collections/articles">Articles</a>
                <a className="adm-btn ghost" href="/admin/collections/categories">Categories</a>
                <a className="adm-btn ghost" href="/admin/collections/media">Media</a>
              </div>
            </Card>
            <Card title="Review &amp; verify">
              <p className="adm-note">
                Check the desk view for status at a glance, or open the live magazine to see exactly what a reader sees.
              </p>
              <div className="adm-quicklinks" style={{ marginTop: 10 }}>
                <a className="adm-btn ghost" href="/app/articles">Article desk</a>
                <a className="adm-btn ghost" href="/" target="_blank" rel="noreferrer">Public homepage ↗</a>
                <Link className="adm-btn ghost" href="/dashboard/health">System health</Link>
              </div>
            </Card>
          </div>
        </Section>

        {/* ---- Recent article queue ---- */}
        <Section title="Recently edited" action={<a className="adm-btn ghost" href="/admin/collections/articles">Open in Payload</a>}>
          <Card>
            {recent.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Title</th><th>Category</th><th>Type</th>
                      <th>Editorial status</th><th>Public</th><th>Updated</th><th>Published</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((a) => {
                      const status = String(a.editorialStatus ?? '');
                      const type = String(a.type ?? '');
                      return (
                        <tr key={String(a.id)}>
                          <td>
                            <div>{(a.title as string) || '(untitled)'}</div>
                            {a.slug ? <span className="adm-cellsub">/{String(a.slug)}</span> : null}
                          </td>
                          <td>{catName(a.category)}</td>
                          <td>{ARTICLE_TYPE_LABEL[type] ?? (type ? type.replace(/_/g, ' ') : '—')}</td>
                          <td><EditorialStatusBadge status={status} /></td>
                          <td><PublicStateBadge status={status} /></td>
                          <td>{fmtDate(a.updatedAt)}</td>
                          <td>{status === 'published' ? fmtDate(a.editorialPublishedAt) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No articles yet. Create one in Payload /admin — an editor reviews everything before it goes live.</Empty>
            )}
          </Card>
        </Section>

        {/* ---- Operating surfaces ---- */}
        <Section title="Operating surfaces">
          <div className="adm-panel">
            <div className="adm-row"><span className="t">Public magazine homepage</span><code>/</code></div>
            <div className="adm-row"><span className="t">Search</span><code>/search</code></div>
            <div className="adm-row"><span className="t">Staff login</span><code>/login</code></div>
            <div className="adm-row"><span className="t">Payload admin (the editing path)</span><code>/admin</code></div>
            <div className="adm-row"><span className="t">Article desk</span><code>/app/articles</code></div>
            <div style={{ marginTop: 10 }}>
              <div className="adm-note" style={{ marginBottom: 6 }}>Magazine sections</div>
              <div className="adm-quicklinks">
                {MAGAZINE_SECTIONS.map((s) => <span key={s.slug} className="adm-badge">/{s.slug}</span>)}
              </div>
            </div>
            <p className="adm-note" style={{ marginTop: 10 }}>
              Reference map only — this panel lists the surfaces, it does not probe them. For live checks see{' '}
              <Link href="/dashboard/health">System health</Link>.
            </p>
          </div>
          <div className="adm-panel" style={{ marginTop: 12 }}>
            <strong>BubbaAffiliate is a separate product.</strong> The seller/creator gateway at <code>bubbaaffiliate.com</code>{' '}
            and its intake are outside ExploringToKnow editorial and are not managed from this dashboard. Public
            ExploringToKnow pages intentionally carry no seller, creator, workspace or SaaS calls to action.
          </div>
        </Section>
      </div>
    </>
  );
}
