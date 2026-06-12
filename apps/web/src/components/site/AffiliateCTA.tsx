import { mediaUrl, AFFILIATE_DISCLOSURE, type Doc } from '@/lib/public';

/**
 * Reusable affiliate CTA driven by the manually-entered Product (or Article)
 * data. The affiliate URL ALWAYS comes from stored data — never discovered.
 * Renders nothing if there is no affiliate URL. Carries data-* identifiers for
 * future click tracking.
 */
export function AffiliateCTA({ article, placement }: { article: Doc; placement: string }) {
  const product = typeof article.product === 'object' ? (article.product as Doc) : null;
  const url = product?.affiliateUrl || product?.externalUrl;
  if (!product || !url) return null;

  const merchant = product.merchantName || 'View offer';
  const label = product.affiliateUrl ? `Check price at ${merchant}` : `View on ${merchant}`;
  const img = mediaUrl(article.images?.product) || mediaUrl(article.images?.hero);
  const productId = String(product.id ?? '');
  const articleId = String(article.id ?? '');

  return (
    <aside
      className="cta"
      data-cta="affiliate"
      data-placement={placement}
      data-article-id={articleId}
      data-product-id={productId}
    >
      <div className="row">
        {img ? <img className="ctaimg" src={img} alt={product.title || merchant} loading="lazy" /> : <div className="ctaimg" aria-hidden />}
        <div className="ctabody">
          <div className="merchant">{merchant}</div>
          <h4>{product.title}</h4>
          {product.priceText ? <div className="price">{product.priceText}</div> : null}
          <div className="actions">
            <a className="btn btn-accent" href={url} target="_blank" rel="sponsored nofollow noopener" data-product-id={productId} data-article-id={articleId}>
              {label}
            </a>
            {product.externalUrl && product.affiliateUrl && product.externalUrl !== product.affiliateUrl ? (
              <a className="btn btn-ghost" href={product.externalUrl} target="_blank" rel="sponsored nofollow noopener">Product details</a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="ctadisc">{AFFILIATE_DISCLOSURE}</div>
    </aside>
  );
}
