import Link from 'next/link';
import { mediaUrl, type Doc } from '@/lib/public';

export function ArticleCard({ article }: { article: Doc }) {
  const cat = typeof article.category === 'object' ? article.category : null;
  const hero = mediaUrl(article.images?.hero);
  const alt = article.images?.heroAlt || article.title;
  return (
    <article className="card">
      <Link href={`/${article.slug}`} className="thumb" aria-label={article.title}>
        {hero ? <img src={hero} alt={alt} loading="lazy" /> : <span>ExploringToKnow</span>}
      </Link>
      <div className="body">
        {cat ? <span className="cat">{cat.name}</span> : null}
        <h3><Link href={`/${article.slug}`}>{article.title}</Link></h3>
        {article.excerpt ? <p>{String(article.excerpt).slice(0, 140)}</p> : null}
        {article.editorialPublishedAt ? (
          <span className="meta">{new Date(article.editorialPublishedAt).toLocaleDateString()}</span>
        ) : null}
      </div>
    </article>
  );
}
