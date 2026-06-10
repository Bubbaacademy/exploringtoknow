// Article page renderer. Phase 2 reads published articles from Payload and
// renders SEO/OG/schema + CTA blocks. Phase 0 is a placeholder.
export default function ArticlePage({ params }: { params: { slug: string[] } }) {
  return (
    <article style={{ padding: 32, fontFamily: 'system-ui' }}>
      <p>Article route placeholder: /{params.slug?.join('/')}</p>
      <p>Rendering implemented in Phase 2.</p>
    </article>
  );
}
