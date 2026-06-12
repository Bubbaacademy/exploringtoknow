import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getPublishedArticle, relatedArticles, mediaUrl, SITE_NAME, SITE_URL, type Doc } from '@/lib/public';
import { AffiliateCTA } from '@/components/site/AffiliateCTA';
import { ArticleCard } from '@/components/site/ArticleCard';

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
      title: og.title || a.title, description: og.description || a.excerpt || undefined,
      type: 'article', url, images: ogImg ? [ogImg] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Args) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug.join('/'));
  if (!a) notFound();

  const category = typeof a.category === 'object' ? (a.category as Doc) : null;
  const hero = mediaUrl(a.images?.hero);
  const heroAlt = a.images?.heroAlt || a.title;
  const html = await marked.parse((a.markdown as string) ?? '');
  const related = await relatedArticles(a, 3);
  const url = `${SITE_URL}/${a.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.excerpt || undefined,
    datePublished: a.editorialPublishedAt || undefined,
    image: hero ? [hero] : undefined,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };

  return (
    <article className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="breadcrumbs">
        <Link href="/">Home</Link> / {category ? <><Link href={`/category/${category.slug}`}>{category.name}</Link> / </> : null}
        <span>{a.title}</span>
      </div>
      <h1>{a.title}</h1>
      {a.editorialPublishedAt ? <p className="meta" style={{ marginTop: 0 }}>{new Date(a.editorialPublishedAt as string).toLocaleDateString()}</p> : null}
      {a.excerpt ? <p className="lead">{a.excerpt as string}</p> : null}

      <div className="article-hero">
        {hero ? <img src={hero} alt={heroAlt} /> : <span>ExploringToKnow</span>}
      </div>
      {a.images?.caption ? <div className="figcaption">{a.images.caption as string}</div> : null}

      <AffiliateCTA article={a} placement="after-intro" />

      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      <AffiliateCTA article={a} placement="conclusion" />

      {related.length ? (
        <section className="section" style={{ borderTop: '1px solid var(--line)', marginTop: 32 }}>
          <h2 style={{ fontSize: 20 }}>Related articles</h2>
          <div className="grid">{related.map((r) => <ArticleCard key={String(r.id)} article={r} />)}</div>
        </section>
      ) : null}
    </article>
  );
}
