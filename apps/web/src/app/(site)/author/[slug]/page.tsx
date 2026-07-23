import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveAuthor, listPublishedArticlesByAuthor, countPublishedByAuthor, mediaUrl, SITE_NAME, SITE_URL, type Doc } from '@/lib/public';
import { ArticleGrid } from '@/components/site/ArticleGrid';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const a = await getActiveAuthor(slug);
  if (!a) return { title: 'Not found', robots: { index: false } };
  const seo = (a.seo ?? {}) as { seoTitle?: string; seoDescription?: string };
  // Only index author pages that actually have published work.
  const hasContent = (await countPublishedByAuthor(a.id)) > 0;
  const title = seo.seoTitle || `${a.name} — ${SITE_NAME}`;
  const description = seo.seoDescription || a.bio || `Guides and reviews by ${a.name} at ${SITE_NAME}.`;
  const url = `${SITE_URL}/author/${a.slug}`;
  // Social preview uses the author's OWN avatar when one is set; omitted entirely
  // otherwise rather than substituting an unrelated image (same pattern as the
  // category page metadata).
  const ogImg = mediaUrl(a.image) || undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: hasContent ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: 'profile', url, siteName: SITE_NAME, images: ogImg ? [ogImg] : undefined },
    twitter: { card: ogImg ? 'summary_large_image' : 'summary', title, description, images: ogImg ? [ogImg] : undefined },
  };
}

export default async function AuthorPage({ params }: Args) {
  const { slug } = await params;
  const author = await getActiveAuthor(slug);
  if (!author) notFound();
  const articles = await listPublishedArticlesByAuthor(author.id, 48);
  const avatar = mediaUrl(author.image);
  const expertise = String(author.expertise || '').split(',').map((s) => s.trim()).filter(Boolean);
  const longBio = (author.longBio as string) || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role || undefined,
    description: author.bio || undefined,
    url: `${SITE_URL}/author/${author.slug}`,
    worksFor: { '@type': 'Organization', name: SITE_NAME },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="cat-masthead">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> / <span aria-current="page">{author.name as string}</span>
          </nav>
          <div className="author-head">
            {avatar ? <img className="author-avatar" src={avatar} alt={author.name as string} /> : null}
            <div>
              <span className="eyebrow">{(author.role as string) || 'Author'}</span>
              <h1>{author.name as string}</h1>
              {author.bio ? <p className="cat-masthead-desc">{author.bio as string}</p> : null}
              {/* Real published count from the articles already fetched — rendered
                  only when there is at least one, so a "0 guides" line is never shown.
                  Reuses the existing category-masthead meta styling. */}
              {articles.length ? (
                <div className="cat-masthead-meta">
                  <span>{articles.length} published {articles.length === 1 ? 'guide' : 'guides'}</span>
                  <span>Independently researched, human-reviewed</span>
                </div>
              ) : null}
              {expertise.length ? (
                <div className="author-expertise">
                  {expertise.map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
              ) : null}
              {author.websiteUrl ? <p className="meta"><a href={author.websiteUrl as string} rel="nofollow noopener" target="_blank">Website</a></p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {longBio ? <p className="author-longbio">{longBio}</p> : null}
          <div className="section-head">
            <div className="section-title">
              <span className="eyebrow">Published work</span>
              <h2>Guides &amp; reviews</h2>
            </div>
          </div>
          <ArticleGrid
            articles={articles}
            empty={
              <div className="empty-panel">
                <span className="eyebrow">Published work</span>
                <h2>No guides published yet</h2>
                <p>When this author’s guides and reviews go live, they’ll appear here. In the meantime, explore the rest of the magazine.</p>
                <div className="empty-panel-actions">
                  <Link href="/explore-picks" className="btn btn-accent">Explore the magazine</Link>
                  <Link href="/categories" className="btn btn-ghost">Browse all topics</Link>
                </div>
              </div>
            }
          />
        </div>
      </section>
    </>
  );
}
