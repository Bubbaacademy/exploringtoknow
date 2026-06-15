'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/article-render';

/**
 * "In this article" table of contents built from real H2/H3 headings (anchors are
 * generated alongside the rendered headings, so they always match). Collapsible on
 * mobile; highlights the active section via IntersectionObserver. Purely additive —
 * it never changes the article wording.
 */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el != null);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav className="article-toc" aria-label="Table of contents">
      <button
        type="button"
        className="article-toc-head"
        aria-expanded={open}
        aria-controls="article-toc-list"
        onClick={() => setOpen((v) => !v)}
      >
        In this article
        <svg className="etk-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ol id="article-toc-list" className={`article-toc-list ${open ? 'open' : ''}`}>
        {items.map((i) => (
          <li key={i.id} className={`toc-d${i.depth} ${active === i.id ? 'active' : ''}`}>
            <a href={`#${i.id}`} onClick={() => setOpen(false)} aria-current={active === i.id ? 'true' : undefined}>
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
