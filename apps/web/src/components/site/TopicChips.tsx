import Link from 'next/link';
import type { Doc } from '@/lib/public';

/**
 * Browse-by-topic chip row built from REAL active categories. Read-only links to
 * canonical category URLs. Optionally shows a published article count when present.
 */
export function TopicChips({ categories, limit, showCount = false }: { categories: Doc[]; limit?: number; showCount?: boolean }) {
  const items = typeof limit === 'number' ? categories.slice(0, limit) : categories;
  if (!items.length) return null;
  return (
    <div className="cat-chips">
      {items.map((c) => (
        <Link key={String(c.id)} href={`/category/${c.slug}`} className="cat-chip">
          <span className="dot" aria-hidden="true">{String(c.name).trim().charAt(0).toUpperCase()}</span>
          {c.name as string}
          {showCount && typeof c.articleCount === 'number' && c.articleCount > 0 ? (
            <span className="chip-count">{c.articleCount}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
