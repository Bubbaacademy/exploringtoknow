import { Marked } from 'marked';
import type { ReactNode } from 'react';
import { mediaUrl, type Doc } from '@/lib/public';

export type TocItem = { id: string; text: string; depth: 2 | 3 };
export type RenderedArticle = { nodes: ReactNode[]; toc: TocItem[]; readingMinutes: number };

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/<[^>]*>/g, '')
      .replace(/&[a-z0-9#]+;/gi, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
}

function countWords(s: string): number {
  const t = (s || '').replace(/[#*_>`~[\]()!]/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').length : 0;
}

/**
 * A Marked instance whose H2/H3 renderer assigns stable, de-duplicated ids and
 * records them into the shared `toc` array — the SAME call produces both the
 * visible heading id and the TOC entry, so anchors and the TOC can never drift.
 * Heading wording is never changed; only an `id` attribute is added.
 */
function makeMarked(toc: TocItem[], seen: Map<string, number>): Marked {
  const m = new Marked();
  const renderer = {
    heading(this: { parser: { parseInline: (t: unknown) => string } }, token: { tokens: unknown[]; depth: number }): string {
      const depth = token.depth;
      const inner = this.parser.parseInline(token.tokens);
      if (depth === 2 || depth === 3) {
        const base = slugify(stripTags(inner));
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        const id = n === 0 ? base : `${base}-${n}`;
        toc.push({ id, text: stripTags(inner), depth: depth as 2 | 3 });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      }
      return `<h${depth}>${inner}</h${depth}>\n`;
    },
  };
  // marked v14 RendererObject typing is stricter than our minimal shape; the
  // runtime contract (this.parser.parseInline + token.depth/tokens) is stable.
  m.use({ renderer: renderer as unknown as Parameters<Marked['use']>[0]['renderer'] });
  return m;
}

/**
 * Render an article body into React nodes plus a table of contents and an
 * estimated reading time. Rendering rules preserve existing behavior exactly:
 *   - bodyBlocks WITH prose  → render the blocks as before (articles already
 *     using the structured renderer are unchanged).
 *   - no bodyBlocks          → render the markdown field (unchanged fallback).
 *   - bodyBlocks with ONLY non-prose blocks (e.g. inline-image-only articles)
 *     → render the stored markdown as the prose body, then the existing blocks,
 *     so the article text (already stored, just previously unrendered) appears.
 * Inline images are de-duplicated by media id; the hero is rendered separately by
 * the page, so it is never reused inline.
 */
export async function renderArticle(article: Doc): Promise<RenderedArticle> {
  const raw: Doc[] = Array.isArray(article.bodyBlocks) ? article.bodyBlocks : [];
  const hasProse = raw.some((b) => b?.blockType === 'prose');
  const markdown = (article.markdown as string) ?? '';

  let blocks: Doc[];
  if (!raw.length) blocks = [{ blockType: 'prose', markdown }];
  else if (!hasProse) blocks = [{ blockType: 'prose', markdown }, ...raw];
  else blocks = raw;

  const heroId = article.images && typeof article.images === 'object'
    ? (typeof (article.images as Doc).hero === 'object' ? (article.images as Doc).hero?.id : (article.images as Doc).hero)
    : null;

  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  const md = makeMarked(toc, seen);
  const usedImg = new Set<string | number>();
  if (heroId != null) usedImg.add(heroId);
  const nodes: ReactNode[] = [];
  let words = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (!b) continue;
    const key = (b.id as string) || `b${i}`;
    if (b.blockType === 'prose') {
      const src = (b.markdown as string) || '';
      words += countWords(src);
      const html = await md.parse(src);
      nodes.push(<div key={key} className="prose" dangerouslySetInnerHTML={{ __html: html }} />);
    } else if (b.blockType === 'inlineImage') {
      const url = mediaUrl(b.image);
      const mid = b.image && typeof b.image === 'object' ? (b.image as Doc).id : b.image;
      if (mid != null && usedImg.has(mid)) continue; // no duplicate inline image, never the hero
      if (mid != null) usedImg.add(mid);
      nodes.push(
        <figure key={key} className={`inline-img ${b.align || 'wide'}`}>
          {url ? <img src={url} alt={(b.alt as string) || ''} loading="lazy" /> : <div className="img-ph">Image</div>}
          {b.caption ? <figcaption className="figcaption">{b.caption as string}</figcaption> : null}
        </figure>,
      );
    } else if (b.blockType === 'callout') {
      const src = (b.body as string) || '';
      words += countWords(src);
      const html = await md.parse(src);
      nodes.push(
        <aside key={key} className={`callout callout-${b.variant || 'info'}`}>
          {b.title ? <div className="callout-title">{b.title as string}</div> : null}
          <div className="callout-body prose" dangerouslySetInnerHTML={{ __html: html }} />
        </aside>,
      );
    } else if (b.blockType === 'pullQuote') {
      words += countWords(b.text as string);
      nodes.push(
        <blockquote key={key} className="pullquote">
          {b.text as string}
          {b.attribution ? <cite>— {b.attribution as string}</cite> : null}
        </blockquote>,
      );
    }
  }

  const readingMinutes = Math.max(1, Math.round(words / 225));
  return { nodes, toc, readingMinutes };
}
