// Article page renderer. Phase 2 reads published articles from Payload and
// renders SEO/OG/schema + CTA blocks. Phase 0/online: placeholder.
export default async function ArticlePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return (
    <article style={{ padding: 32, fontFamily: 'system-ui' }}>
      <p>Article route placeholder: /{slug?.join('/')}</p>
      <p>Rendering implemented in a later phase.</p>
    </article>
  );
}
