import type { Metadata } from 'next';
import Link from 'next/link';
import { listActiveCategories, countPublishedInCategory, mediaUrl, SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Categories — ${SITE_NAME}`,
  description: 'Browse product review categories.',
  alternates: { canonical: `${SITE_URL}/categories` },
};

export default async function CategoriesPage() {
  const categories = await listActiveCategories();
  const counts = await Promise.all(categories.map((c) => countPublishedInCategory(c.id)));
  return (
    <section className="section">
      <div className="container">
        <h1>Categories</h1>
        {categories.length ? (
          <div className="grid" style={{ marginTop: 16 }}>
            {categories.map((c, i) => (
              <Link key={String(c.id)} href={`/category/${c.slug}`} className="card">
                <div className="thumb">{mediaUrl(c.image) ? <img src={mediaUrl(c.image)!} alt={c.name} loading="lazy" /> : <span>{c.name}</span>}</div>
                <div className="body">
                  <h3>{c.name}</h3>
                  {c.description ? <p>{String(c.description).slice(0, 130)}</p> : null}
                  <span className="meta">{counts[i]} article{counts[i] === 1 ? '' : 's'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="meta">No categories yet.</p>}
      </div>
    </section>
  );
}
