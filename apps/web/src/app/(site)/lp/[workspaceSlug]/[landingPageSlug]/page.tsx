import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedLandingPage } from '@/lib/landing';
import { isSafeHttpUrl } from '@/lib/landing-constants';
import { SITE_NAME, SITE_URL } from '@/lib/public';

export const dynamic = 'force-dynamic';
type Args = { params: Promise<{ workspaceSlug: string; landingPageSlug: string }> };

const hex = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return /^#?[0-9a-fA-F]{3,8}$/.test(t) ? (t.startsWith('#') ? t : `#${t}`) : null;
};
const paragraphs = (body: unknown): string[] =>
  typeof body === 'string' ? body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { workspaceSlug, landingPageSlug } = await params;
  const res = await getPublishedLandingPage(workspaceSlug, landingPageSlug);
  if (!res) return { title: 'Not found', robots: { index: false, follow: false } };
  const { page, workspace } = res;
  const noindex = page.noindex !== false; // default-safe: index only when explicitly allowed
  return {
    title: (page.seoTitle as string) || (page.title as string) || `${workspace.name} — ${SITE_NAME}`,
    description: (page.seoDescription as string) || (page.subheadline as string) || undefined,
    alternates: { canonical: `${SITE_URL}/lp/${workspaceSlug}/${landingPageSlug}` },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function PublicLandingPage({ params }: Args) {
  const { workspaceSlug, landingPageSlug } = await params;
  const res = await getPublishedLandingPage(workspaceSlug, landingPageSlug);
  if (!res) notFound();
  const { page, brand } = res!;

  const primary = hex(brand?.primaryColor) || '#0e3a2b';
  const accent = hex(brand?.accentColor) || '#14543f';
  const cta = isSafeHttpUrl(page.ctaUrl) ? String(page.ctaUrl).trim() : null;
  const paras = paragraphs(page.body);
  const disclosure = (page.disclosureText as string) || '';

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ borderTop: `4px solid ${primary}`, paddingTop: 20 }}>
          {page.headline ? <h1 style={{ color: primary, marginBottom: 8 }}>{page.headline as string}</h1> : <h1 style={{ marginBottom: 8 }}>{page.title as string}</h1>}
          {page.subheadline ? <p className="cat-masthead-desc" style={{ fontSize: 18 }}>{page.subheadline as string}</p> : null}
        </div>

        {paras.length ? (
          <div style={{ marginTop: 18, lineHeight: 1.7 }}>
            {paras.map((p, i) => <p key={i} style={{ marginBottom: 14 }}>{p}</p>)}
          </div>
        ) : null}

        {cta && page.ctaLabel ? (
          <p style={{ marginTop: 24 }}>
            <a href={cta} className="btn btn-accent" style={{ background: accent, borderColor: accent }} rel="nofollow sponsored noopener" target="_blank">{page.ctaLabel as string}</a>
          </p>
        ) : null}

        {disclosure ? (
          <p className="meta" style={{ marginTop: 28, fontSize: 13, color: 'var(--ink-soft, #6b7480)' }}>{disclosure}</p>
        ) : null}
      </div>
    </section>
  );
}
