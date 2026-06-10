export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <section style={{ padding: 32 }}><p>Category placeholder: {slug}</p></section>;
}
