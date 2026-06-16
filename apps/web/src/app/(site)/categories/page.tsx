import type { Metadata } from 'next';
import Link from 'next/link';
import { listActiveCategoriesWithCounts, SITE_NAME, SITE_URL } from '@/lib/public';
import { groupCategories } from '@/lib/nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `All Topics — ${SITE_NAME}`,
  description: 'Browse every ExploringToKnow topic — independent buying guides and product reviews across home, tech, health, style and more.',
  alternates: { canonical: `${SITE_URL}/categories` },
};

export default async function CategoriesPage() {
  const cats = await listActiveCategoriesWithCounts();
  const countBySlug = new Map(cats.map((c) => [c.slug as string, c.articleCount]));
  const descBySlug = new Map(cats.map((c) => [c.slug as string, (c.description as string) || '']));
  const groups = groupCategories(cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
  const withContent = cats.filter((c) => c.articleCount > 0).length;

  return (
    <section className="section">
      <div className="container">
        <div className="hub-head">
          <span className="eyebrow">Browse</span>
          <h1>All Topics</h1>
          <p className="hub-head-desc">
            Explore independent buying guides and reviews across {cats.length} topics
            {withContent > 0 ? <> — {withContent} with published guides today</> : null}. Every guide
            is manually researched and human-reviewed before it goes live.
          </p>
        </div>

        {groups.map((g) => (
          <div key={g.title} className="hub-group">
            <h2 className="hub-group-title">{g.title}</h2>
            <div className="topic-grid">
              {g.items.map((c) => {
                const n = countBySlug.get(c.slug) ?? 0;
                const desc = descBySlug.get(c.slug);
                return (
                  <Link key={c.slug} href={`/category/${c.slug}`} className="topic-card">
                    <span className="topic-card-mark" aria-hidden="true">{c.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="topic-card-body">
                      <span className="topic-card-name">{c.name}</span>
                      {desc ? <span className="topic-card-desc">{desc.slice(0, 80)}</span> : null}
                      <span className="topic-card-count">{n > 0 ? `${n} ${n === 1 ? 'guide' : 'guides'}` : 'Coming soon'}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
