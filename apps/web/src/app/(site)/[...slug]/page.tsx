import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPublishedArticle,
  relatedArticles,
  getArticleAffiliate,
  mediaUrl,
  SITE_NAME,
  SITE_URL,
  ARTICLE_AFFILIATE_DISCLOSURE,
  type Doc,
} from '@/lib/public';
import { AffiliateCTA } from '@/components/site/AffiliateCTA';
import { ArticleCard } from '@/components/site/ArticleCard';
import { ReadingProgress } from '@/components/site/ReadingProgress';
import { ArticleToc } from '@/components/site/ArticleToc';
import { NewsletterSignup } from '@/components/site/NewsletterSignup';
import { ViewTracker } from '@/components/site/ViewTracker';
import { renderArticle } from '@/lib/article-render';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug.join('/'));
  if (!a) return { title: 'Not found', robots: { index: false } };
  const seo = (a.seo ?? {}) as Doc;
  const og = (a.openGraph ?? {}) as Doc;
  const ogImg = mediaUrl(a.images?.og) || mediaUrl(og.image) || mediaUrl(a.images?.hero) || undefined;
  const url = `${SITE_URL}/${a.slug}`;
  return {
    title: seo.metaTitle || a.title,
    description: seo.metaDescription || a.excerpt || undefined,
    alternates: { canonical: seo.canonical || url },
    openGraph: {
      title: og.title || a.title,
      description: og.description || a.excerpt || undefined,
      type: 'article',
      url,
      images: ogImg ? [ogImg] : undefined,
    },
  };
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function ArticlePage({ params }: Args) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug.join('/'));
  if (!a) notFound();

  const category = typeof a.category === 'object' ? (a.category as Doc) : null;
  const author = typeof a.author === 'object' ? (a.author as Doc) : null;
  const hero = mediaUrl(a.images?.hero);
  const heroAlt = (a.images?.heroAlt as string) || (a.title as string);
  const affiliate = getArticleAffiliate(a);
  const { nodes, toc, readingMinutes } = await renderArticle(a);
  const related = await relatedArticles(a, 3);
  const url = `${SITE_URL}/${a.slug}`;

  const publishedAt = a.editorialPublishedAt ? new Date(a.editorialPublishedAt as string) : null;
  const updatedAt = a.updatedAt ? new Date(a.updatedAt as string) : null;
  const showUpdated =
    publishedAt && updatedAt &&
    updatedAt.getTime() - publishedAt.getTime() > 86_400_000 &&
    updatedAt.toDateString() !== publishedAt.toDateString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt || undefined,
    datePublished: a.editorialPublishedAt || undefined,
    dateModified: (showUpdated ? a.updatedAt : a.editorialPublishedAt) || undefined,
    image: hero ? [hero] : undefined,
    articleSection: category?.name || undefined,
    mainEntityOfPage: url,
    author: author?.name
      ? { '@type': 'Person', name: author.name, url: author.slug ? `${SITE_URL}/author/${author.slug}` : undefined }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      ...(category ? [{ '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}/category/${category.slug}` }] : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name: a.title, item: url },
    ],
  };

  return (
    <>
      <ReadingProgress />
      <ViewTracker id={a.id} />
      <article className="article">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

        <header className="article-head">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> /{' '}
            {category ? (
              <>
                <Link href={`/category/${category.slug}`}>{category.name as string}</Link> /{' '}
              </>
            ) : null}
            <span aria-current="page">{a.title as string}</span>
          </nav>

          {category ? (
            <Link href={`/category/${category.slug}`} className="article-cat">{category.name as string}</Link>
          ) : null}

          <h1>{a.title as string}</h1>

          {a.excerpt ? <p className="article-deck">{a.excerpt as string}</p> : null}

          <div className="article-byline">
            {author?.slug
              ? <Link href={`/author/${author.slug}`} className="article-author">{author.name as string}</Link>
              : <Link href="/about" className="article-author">ExploringToKnow Editorial Team</Link>}
            {publishedAt ? (
              <span className="article-meta-item">
                <time dateTime={publishedAt.toISOString()}>{fmtDate(publishedAt)}</time>
              </span>
            ) : null}
            {showUpdated && updatedAt ? (
              <span className="article-meta-item">Updated <time dateTime={updatedAt.toISOString()}>{fmtDate(updatedAt)}</time></span>
            ) : null}
            <span className="article-meta-item">{readingMinutes} min read</span>
          </div>
        </header>

        <figure className="article-hero">
          <div className="article-hero-media">
            {hero ? <img src={hero} alt={heroAlt} /> : <span>ExploringToKnow</span>}
          </div>
          {a.images?.caption ? <figcaption className="figcaption">{a.images.caption as string}</figcaption> : null}
        </figure>

        {affiliate ? (
          <p className="article-disclosure" role="note">{ARTICLE_AFFILIATE_DISCLOSURE} <Link href="/affiliate-disclosure">Learn more</Link>.</p>
        ) : null}

        <ArticleToc items={toc} />

        <AffiliateCTA article={a} placement="after-intro" />

        <div className="article-body">{nodes}</div>

        <AffiliateCTA article={a} placement="conclusion" />

        <section className="article-end" aria-label="Keep exploring">
          <div className="article-end-actions">
            {category ? (
              <Link href={`/category/${category.slug}`} className="btn btn-ghost">Browse {category.name as string}</Link>
            ) : (
              <Link href="/categories" className="btn btn-ghost">Browse all topics</Link>
            )}
            <Link href="/explore-picks" className="btn btn-accent">Explore more guides</Link>
          </div>
        </section>

        {related.length ? (
          <section className="related" aria-label="Related guides">
            <div className="section-head">
              <div className="section-title">
                <span className="eyebrow">Keep reading</span>
                <h2>Continue Exploring</h2>
              </div>
            </div>
            <div className="grid">
              {related.map((r) => (
                <ArticleCard key={String(r.id)} article={r} />
              ))}
            </div>
          </section>
        ) : null}

        <NewsletterSignup source="article" variant="inline" />
      </article>
    </>
  );
}
