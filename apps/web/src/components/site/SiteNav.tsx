'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from './Brand';
import { PRIMARY_NAV, TOPICS_HREF, SEARCH_HREF, type TopicGroup } from '@/lib/nav';

/* ---- icons (inline, no runtime font/icon dependency) ---- */
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg className="etk-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchForm({ id, inputRef, onSubmitNavigate }: { id: string; inputRef?: RefObject<HTMLInputElement | null>; onSubmitNavigate?: () => void }) {
  return (
    <form className="etk-search-form" role="search" action={SEARCH_HREF} method="get" onSubmit={onSubmitNavigate}>
      <label htmlFor={id} className="sr-only">Search articles</label>
      <span className="etk-search-ic" aria-hidden="true"><SearchIcon /></span>
      <input
        ref={inputRef}
        id={id}
        type="search"
        name="q"
        placeholder="Search guides &amp; reviews"
        maxLength={100}
        autoComplete="off"
      />
      <button type="submit" className="btn etk-search-go">Search</button>
    </form>
  );
}

export function SiteNav({ groups }: { groups: TopicGroup[] }) {
  const pathname = usePathname();
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const topicsBtnRef = useRef<HTMLButtonElement>(null);
  const topicsPanelRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const megaId = useId();

  // Close all layers whenever the route changes (covers link navigation).
  useEffect(() => {
    setTopicsOpen(false);
    setSearchOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // Escape closes the topmost open layer and restores focus to its trigger.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) { setDrawerOpen(false); menuBtnRef.current?.focus(); }
      else if (searchOpen) { setSearchOpen(false); searchBtnRef.current?.focus(); }
      else if (topicsOpen) { setTopicsOpen(false); topicsBtnRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, searchOpen, topicsOpen]);

  // Outside click closes the desktop mega menu and search panel.
  useEffect(() => {
    if (!topicsOpen && !searchOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (topicsOpen && !topicsPanelRef.current?.contains(t) && !topicsBtnRef.current?.contains(t)) setTopicsOpen(false);
      if (searchOpen && !searchPanelRef.current?.contains(t) && !searchBtnRef.current?.contains(t)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [topicsOpen, searchOpen]);

  // Autofocus the desktop search input on open.
  useEffect(() => { if (searchOpen) searchInputRef.current?.focus(); }, [searchOpen]);

  // Mobile drawer: lock body scroll, trap focus, restore on close.
  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const drawer = drawerRef.current;
    const getFocusable = (): HTMLElement[] =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    getFocusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const f = getFocusable();
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    drawer?.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      drawer?.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ---------- Desktop navigation ---------- */}
      <nav className="etk-nav" aria-label="Primary">
        <div
          className="etk-topics"
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setTopicsOpen(false); }}
        >
          <button
            ref={topicsBtnRef}
            type="button"
            className="etk-navlink etk-topics-btn"
            aria-expanded={topicsOpen}
            aria-controls={megaId}
            aria-haspopup="true"
            onClick={() => { setTopicsOpen((v) => !v); setSearchOpen(false); }}
          >
            Topics <Chevron />
          </button>
          <div
            ref={topicsPanelRef}
            id={megaId}
            className={`etk-mega ${topicsOpen ? 'open' : ''}`}
            role="region"
            aria-label="Browse topics"
            aria-hidden={!topicsOpen}
          >
            <div className="etk-mega-grid">
              {groups.map((g) => (
                <div key={g.title} className="etk-mega-col">
                  <h3>{g.title}</h3>
                  <ul>
                    {g.items.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/category/${c.slug}`}>{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="etk-mega-foot">
              <Link href={TOPICS_HREF} className="etk-viewall">View all topics →</Link>
            </div>
          </div>
        </div>

        {PRIMARY_NAV.map((l) => (
          <Link key={l.href} href={l.href} className="etk-navlink">{l.label}</Link>
        ))}

        <div className="etk-search-wrap">
          <button
            ref={searchBtnRef}
            type="button"
            className="etk-iconbtn"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((v) => !v); setTopicsOpen(false); }}
          >
            <SearchIcon />
          </button>
          <div ref={searchPanelRef} className={`etk-searchpanel ${searchOpen ? 'open' : ''}`} aria-hidden={!searchOpen}>
            <SearchForm id="etk-desktop-search" inputRef={searchInputRef} />
          </div>
        </div>
      </nav>

      {/* ---------- Mobile bar (compact) ---------- */}
      <div className="etk-nav-mobile">
        <Link href={SEARCH_HREF} className="etk-iconbtn" aria-label="Search">
          <SearchIcon />
        </Link>
        <button
          ref={menuBtnRef}
          type="button"
          className="etk-iconbtn"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="etk-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </button>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <div className={`etk-drawer-overlay ${drawerOpen ? 'open' : ''}`} hidden={!drawerOpen} onClick={() => setDrawerOpen(false)} />
      <div
        id="etk-drawer"
        ref={drawerRef}
        className={`etk-drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!drawerOpen}
      >
        <div className="etk-drawer-top">
          <Brand onClick={() => setDrawerOpen(false)} />
          <button type="button" className="etk-iconbtn" aria-label="Close menu" onClick={() => { setDrawerOpen(false); menuBtnRef.current?.focus(); }}>
            <CloseIcon />
          </button>
        </div>

        <div className="etk-drawer-body">
          <SearchForm id="etk-mobile-search" onSubmitNavigate={() => setDrawerOpen(false)} />

          <nav className="etk-drawer-nav" aria-label="Mobile">
            {PRIMARY_NAV.map((l) => (
              <Link key={l.href} href={l.href} className="etk-drawer-link" onClick={() => setDrawerOpen(false)}>{l.label}</Link>
            ))}
            <Link href={TOPICS_HREF} className="etk-drawer-link" onClick={() => setDrawerOpen(false)}>All Topics</Link>
          </nav>

          <div className="etk-drawer-topics">
            <div className="etk-drawer-heading">Browse by topic</div>
            {groups.map((g) => {
              const isOpen = openGroup === g.title;
              return (
                <div key={g.title} className="etk-acc">
                  <button
                    type="button"
                    className="etk-acc-btn"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroup(isOpen ? null : g.title)}
                  >
                    {g.title} <Chevron />
                  </button>
                  <ul className={`etk-acc-panel ${isOpen ? 'open' : ''}`} hidden={!isOpen}>
                    {g.items.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/category/${c.slug}`} onClick={() => setDrawerOpen(false)}>{c.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
