import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { isStadoraArticleNumber, productPath } from '../data/content'
import { weightForSelection } from '../data/inoplex-config'

/** Catalog grid: 2 columns on small screens, 4 from 850 px (see index.css). */
export const PRODUCT_LISTING_GRID = 'product-listing-grid'

export function ProductCard({ product }: { product: Product }) {
  const img = product.images.find((image) => image.kind === 'studio') ?? product.images[0]
  const cardWeight = weightForSelection(product).beside
  return (
    <article className="flex h-full flex-col">
      <Link
        to={productPath(product)}
        className="relative block aspect-square overflow-hidden bg-paper"
      >
        {img && (
          <img
            src={img.src}
            alt={img.alt}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="kicker">{product.subcategory}</p>
        <h3 className="text-base font-medium leading-snug">
          <Link to={productPath(product)} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {isStadoraArticleNumber(product.sku) || product.visibility === 'internal_preview' ? (
          product.sku && !product.materials?.length ? (
            <p className="font-ui text-xs tabular-nums text-muted">Art.nr {product.sku}</p>
          ) : null
        ) : null}
        {product.material && (
          <p className="line-clamp-1 text-sm text-muted">{product.material}</p>
        )}
        {!product.material && cardWeight ? (
          <p className="text-sm text-muted">{cardWeight}</p>
        ) : null}
        <p className="mt-auto pt-2 text-xs font-medium uppercase tracking-[0.08em] text-sage-dark">
          {product.quoteOnRequest ? 'Pris på förfrågan' : 'Pris i offert'}
        </p>
      </div>
    </article>
  )
}
