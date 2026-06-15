import Link from 'next/link';
import { mediaUrl, type Doc } from '@/lib/public';

export function ArticleCard({ article }: { article: Doc }) {
  const cat = typeof article.category === 'object' ? article.category : null;
  const hero = mediaUrl(article.images?.hero);
  const alt = article.images?.heroAlt || article.title;
  const date = article.editorialPublishedAt
    ? new Date(article.editorialPublishedAt as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  return (
    <article className="card">
      <Link href={`/${article.slug}`} className="thumb" aria-label={article.title}>
        {hero ? <img src={hero} alt={alt} loading="lazy" /> : <span>ExploringToKnow</span>}
      </Link>
      <div className="body">
        {cat ? <span className="cat">{cat.name as string}</span> : null}
        <h3><Link href={`/${article.slug}`}>{article.title as string}</Link></h3>
        {article.excerpt ? <p>{String(article.excerpt).slice(0, 140)}</p> : null}
        {date ? <div className="card-foot"><span className="meta">{date}</span></div> : null}
      </div>
    </article>
  );
}
