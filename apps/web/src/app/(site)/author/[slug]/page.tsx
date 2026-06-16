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
  return {
    title: seo.seoTitle || `${a.name} — ${SITE_NAME}`,
    description: seo.seoDescription || a.bio || `Guides and reviews by ${a.name} at ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/author/${a.slug}` },
    robots: hasContent ? undefined : { index: false, follow: true },
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
                <span className="eyebrow">Coming soon</span>
                <h2>No published guides yet</h2>
                <p>This author’s published work will appear here.</p>
                <div className="empty-panel-actions">
                  <Link href="/explore" className="btn btn-accent">Explore the magazine</Link>
                </div>
              </div>
            }
          />
        </div>
      </section>
    </>
  );
}
