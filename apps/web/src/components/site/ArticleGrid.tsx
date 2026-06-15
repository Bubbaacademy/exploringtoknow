import type { ReactNode } from 'react';
import { ArticleCard } from './ArticleCard';
import type { Doc } from '@/lib/public';

/** Shared responsive grid of article cards with a graceful empty state. */
export function ArticleGrid({ articles, empty }: { articles: Doc[]; empty?: ReactNode }) {
  if (!articles.length) return <>{empty ?? null}</>;
  return (
    <div className="grid">
      {articles.map((a) => (
        <ArticleCard key={String(a.id)} article={a} />
      ))}
    </div>
  );
}
