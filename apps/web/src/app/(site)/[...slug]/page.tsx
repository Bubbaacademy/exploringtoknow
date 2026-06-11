import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import { marked } from 'marked';
import config from '@payload-config';

type Args = { params: Promise<{ slug: string[] }> };

async function getPublishedArticle(slug: string) {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ?? null;
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug.join('/'));
  if (!a) return { title: 'Not found' };
  const seo = (a.seo ?? {}) as { metaTitle?: string; metaDescription?: string };
  const og = (a.openGraph ?? {}) as { title?: string; description?: string };
  return {
    title: seo.metaTitle || (a.title as string),
    description: seo.metaDescription,
    openGraph: { title: og.title || (a.title as string), description: og.description, type: 'article' },
  };
}

export default async function ArticlePage({ params }: Args) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug.join('/'));
  if (!a) notFound();
  const html = await marked.parse((a.markdown as string) ?? '');
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 34, lineHeight: 1.2, marginBottom: 8 }}>{a.title as string}</h1>
      {a.publishedAt ? (
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0 }}>
          {new Date(a.publishedAt as string).toLocaleDateString()}
        </p>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
