import { marked } from 'marked';
import { mediaUrl, type Doc } from '@/lib/public';

/**
 * Renders the article body. If `bodyBlocks` is present and non-empty, renders the
 * ordered blocks (prose / inlineImage / callout / pullQuote). Otherwise falls
 * back to rendering the existing `markdown` field exactly as before.
 */
export async function ArticleBody({ article }: { article: Doc }) {
  const blocks: Doc[] = Array.isArray(article.bodyBlocks) ? article.bodyBlocks : [];

  if (!blocks.length) {
    const html = await marked.parse((article.markdown as string) ?? '');
    return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (!b) continue;
    const key = (b.id as string) || String(i);
    if (b.blockType === 'prose') {
      const html = await marked.parse((b.markdown as string) || '');
      nodes.push(<div key={key} className="prose" dangerouslySetInnerHTML={{ __html: html }} />);
    } else if (b.blockType === 'inlineImage') {
      const url = mediaUrl(b.image);
      nodes.push(
        <figure key={key} className={`inline-img ${b.align || 'wide'}`}>
          {url ? <img src={url} alt={(b.alt as string) || ''} loading="lazy" /> : <div className="img-ph">Image</div>}
          {b.caption ? <figcaption className="figcaption">{b.caption as string}</figcaption> : null}
        </figure>,
      );
    } else if (b.blockType === 'callout') {
      const html = await marked.parse((b.body as string) || '');
      nodes.push(
        <aside key={key} className={`callout callout-${b.variant || 'info'}`}>
          {b.title ? <div className="callout-title">{b.title as string}</div> : null}
          <div className="callout-body prose" dangerouslySetInnerHTML={{ __html: html }} />
        </aside>,
      );
    } else if (b.blockType === 'pullQuote') {
      nodes.push(
        <blockquote key={key} className="pullquote">
          {b.text as string}
          {b.attribution ? <cite>— {b.attribution as string}</cite> : null}
        </blockquote>,
      );
    }
  }
  return <>{nodes}</>;
}
