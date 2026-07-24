import Link from 'next/link';
import { client, getAdminOverview, listActiveCategoriesWithCounts, type Doc } from '@/lib/public';
import { MAGAZINE_SECTIONS } from '@/lib/sections';
import { getArticleFlags, topLevel, type QaFlag, type QaLevel } from '@/lib/content-qa';
import {
  Section, Stat, Card, Empty, Badge,
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

const catSlug = (rel: unknown): string | null =>
  rel && typeof rel === 'object' ? (String((rel as { slug?: unknown }).slug ?? '') || null) : null;

/**
 * Read-only counts + recent queue + the full article set for the Content QA panel.
 * Mirrors the existing lib/public read patterns (literal collection slug, `limit: 0`
 * for a pure count). No writes anywhere. The `all` fetch (depth 1, so category and
 * hero relationships resolve) is the single source the QA flags are derived from —
 * no fabricated counts. Production holds a handful of articles; the 500 cap is
 * headroom, and `recent` is sliced from `all` rather than re-queried.
 */
async function loadEditorialOps() {
  const payload = await client();

  const [overview, rejectedRes, totalRes, allRes, cats] = await Promise.all([
    getAdminOverview(),
    payload.find({ collection: 'articles', where: { editorialStatus: { equals: 'rejected' } }, limit: 0, depth: 0 }),
    payload.find({ collection: 'articles', limit: 0, depth: 0 }),
    payload.find({ collection: 'articles', sort: '-updatedAt', limit: 500, depth: 1 }),
    listActiveCategoriesWithCounts(),
  ]);

  const all = allRes.docs as Doc[];
  return {
    overview,
    rejected: rejectedRes.totalDocs,
    total: totalRes.totalDocs,
    recent: all.slice(0, 10),
    all,
    cats,
  };
}

/** Flag chips for one article, using the shared badge variants (err/warn/info). */
function FlagChips({ flags }: { flags: QaFlag[] }) {
  return (
    <div className="adm-quicklinks">
      {flags.map((f) => (
        <Badge key={f.code} variant={f.level}>
          <span title={f.detail ?? f.label}>{f.label}</span>
        </Badge>
      ))}
    </div>
  );
}

export default async function ContentOpsPage() {
  const { overview, rejected, total, recent, all, cats } = await loadEditorialOps();
  const c = (k: string): number => overview.counts[k] ?? 0;
  const review = c('review');

  // ---- Content QA (Phase 2Q): all flags derived from the already-fetched `all`. ----
  const flagged = all
    .map((a) => ({ a, flags: getArticleFlags(a) }))
    .filter((r) => r.flags.length > 0);
  const isLive = (a: Doc) => String(a.editorialStatus ?? '').toLowerCase() === 'published';

  // Live problems: published articles a reader is affected by right now.
  const liveProblems = flagged
    .filter((r) => isLive(r.a) && r.flags.some((f) => f.level !== 'info'))
    .sort((x, y) => (topLevel(y.flags) === 'err' ? 1 : 0) - (topLevel(x.flags) === 'err' ? 1 : 0));
  // Readiness / clutter: not-yet-public articles with advisory notes.
  const readiness = flagged.filter((r) => !isLive(r.a));

  // Section coverage — which magazine sections have any published content.
  const publishedDocs = all.filter(isLive);
  const publishedTypes = new Set(publishedDocs.map((a) => String(a.type ?? '')));
  const publishedCatSlugs = new Set(publishedDocs.map((a) => catSlug(a.category)).filter(Boolean) as string[]);
  const sectionHasContent = (s: (typeof MAGAZINE_SECTIONS)[number]): boolean => {
    if (s.kind === 'type') return (s.types ?? []).some((t) => publishedTypes.has(t));
    if (s.kind === 'category') return (s.categorySlugs ?? []).some((sl) => publishedCatSlugs.has(sl));
    return publishedDocs.length > 0; // curated (Explore Picks)
  };
  const emptySections = MAGAZINE_SECTIONS.filter((s) => !sectionHasContent(s));
  // Empty active categories — honest "not broken, just empty" (real counts from the helper).
  const emptyCats = cats.filter((cat) => (cat.articleCount ?? 0) === 0);

  const flagCount = (lvl: QaLevel) =>
    liveProblems.reduce((n, r) => n + r.flags.filter((f) => f.level === lvl).length, 0);

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

        {/* ---- Content QA / Publishing readiness (Phase 2Q) — READ-ONLY ---- */}
        <Section
          title="Content QA / Publishing readiness"
          action={<a className="adm-btn ghost" href="/admin/collections/articles">Fix in Payload /admin</a>}
        >
          <div className="adm-panel">
            <p className="adm-note">
              Read-only quality checks over real article records. <b>Public visibility is controlled by Editorial status
              only</b> — Pipeline status does not make an article public. <b>Fix content in Payload /admin</b>; there is
              <b> no automatic publishing</b>, and this dashboard never writes.
            </p>
            <div className="adm-quicklinks" style={{ marginTop: 10 }}>
              <Badge variant={flagCount('err') > 0 ? 'err' : 'ok'}>{flagCount('err')} live errors</Badge>
              <Badge variant={flagCount('warn') > 0 ? 'warn' : 'ok'}>{flagCount('warn')} live warnings</Badge>
              <Badge>{readiness.length} draft{readiness.length === 1 ? '' : 's'} with notes</Badge>
              <Badge>{emptySections.length}/{MAGAZINE_SECTIONS.length} sections empty</Badge>
              <Badge>{emptyCats.length} categories with no published guides</Badge>
            </div>
          </div>

          {/* Live problems — published articles a reader sees now. */}
          <Card title="Live problems (published articles)">
            {liveProblems.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table">
                  <thead>
                    <tr><th>Article</th><th>Category</th><th>Type</th><th>Flags</th><th>Fix</th></tr>
                  </thead>
                  <tbody>
                    {liveProblems.map(({ a, flags }) => {
                      const type = String(a.type ?? '');
                      return (
                        <tr key={String(a.id)}>
                          <td>
                            <div>{(a.title as string) || '(untitled)'}</div>
                            {a.slug ? <span className="adm-cellsub">/{String(a.slug)}</span> : null}
                          </td>
                          <td>{catName(a.category)}</td>
                          <td>{ARTICLE_TYPE_LABEL[type] ?? (type ? type.replace(/_/g, ' ') : '—')}</td>
                          <td><FlagChips flags={flags} /></td>
                          <td><a className="adm-btn ghost" href={`/admin/collections/articles/${a.id}`}>Edit ↗</a></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No quality problems on published articles — every live article has a category, excerpt, hero image and editorial alt text. ✓</Empty>
            )}
          </Card>

          {/* Publishing readiness — not-yet-public articles (advisory only). */}
          <Section title="Publishing readiness (not public)">
            <Card>
              {readiness.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr><th>Article</th><th>Editorial status</th><th>Public</th><th>Notes</th><th>Open</th></tr>
                    </thead>
                    <tbody>
                      {readiness.map(({ a, flags }) => {
                        const status = String(a.editorialStatus ?? '');
                        return (
                          <tr key={String(a.id)}>
                            <td>
                              <div>{(a.title as string) || '(untitled)'}</div>
                              {a.slug ? <span className="adm-cellsub">/{String(a.slug)}</span> : null}
                            </td>
                            <td><EditorialStatusBadge status={status} /></td>
                            <td><PublicStateBadge status={status} /></td>
                            <td><FlagChips flags={flags} /></td>
                            <td><a className="adm-btn ghost" href={`/admin/collections/articles/${a.id}`}>Open ↗</a></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No non-public articles need attention.</Empty>
              )}
              <p className="adm-note" style={{ marginTop: 10 }}>
                These are <b>not public</b> — nothing here affects readers. Test/mock drafts are safe to leave, or delete in
                Payload to declutter. A “Pipeline says Published, but NOT public” note means only the AI/QA state reads
                published; the article stays hidden until <b>Editorial status</b> is set to Published by a human.
              </p>
            </Card>
          </Section>

          {/* Coverage — honest empty states, not errors. */}
          <Section title="Coverage gaps (empty, not broken)">
            <div className="adm-cols-2">
              <Card title="Sections with no published content">
                {emptySections.length ? (
                  <>
                    <div className="adm-quicklinks">
                      {emptySections.map((s) => (
                        <Badge key={s.slug} variant={s.slug === 'buying-guides' || s.slug === 'product-reviews' ? 'warn' : ''}>
                          /{s.slug}
                        </Badge>
                      ))}
                    </div>
                    <p className="adm-note" style={{ marginTop: 10 }}>
                      These render honest “In progress” states today. <b>Buying Guides</b> and <b>Product Reviews</b> are
                      type-driven — they stay empty until an article’s <b>type</b> is Buying Guide / Best List / Comparison /
                      How-To (guides) or Review / Comparison (reviews). Not broken — just awaiting content.
                    </p>
                  </>
                ) : (
                  <Empty>Every magazine section has published content. ✓</Empty>
                )}
              </Card>
              <Card title="Categories with no published guides">
                {emptyCats.length ? (
                  <>
                    <div className="adm-quicklinks">
                      {emptyCats.slice(0, 30).map((cat) => (
                        <Badge key={String(cat.id)}>{String(cat.name)}</Badge>
                      ))}
                    </div>
                    <p className="adm-note" style={{ marginTop: 10 }}>
                      {emptyCats.length} active {emptyCats.length === 1 ? 'category has' : 'categories have'} no published
                      article yet. This is expected while the magazine is young — the categories are live and ready, just
                      empty. Nothing is broken.
                    </p>
                  </>
                ) : (
                  <Empty>Every active category has at least one published guide. ✓</Empty>
                )}
              </Card>
            </div>
          </Section>
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
