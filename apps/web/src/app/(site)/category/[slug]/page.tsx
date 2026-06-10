export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <section style={{ padding: 32 }}><p>Category placeholder: {params.slug}</p></section>;
}
