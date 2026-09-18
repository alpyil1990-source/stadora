import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { isStadoraArticleNumber, productPath } from '../data/content'
import { weightForSelection } from '../data/inoplex-config'

export function ProductCard({ product }: { product: Product }) {
  const img = product.images.find((image) => image.kind === 'studio') ?? product.images[0]
  const cardWeight = weightForSelection(product).beside
  return (
    <article className="flex h-full flex-col border border-line bg-sheet">
      <Link
        to={productPath(product)}
        className="relative block aspect-[5/4] shrink-0 overflow-hidden bg-paper"
      >
        {img && (
          <img
            src={img.src}
            alt={img.alt}
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="kicker">{product.subcategory}</p>
        <h3 className="text-lg font-medium leading-snug">
          <Link to={productPath(product)} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {isStadoraArticleNumber(product.sku) || product.visibility === 'internal_preview' ? (
          product.sku && !product.materials?.length ? (
            <p className="font-ui text-xs tabular-nums text-muted">Art.nr {product.sku}</p>
          ) : null
        ) : null}
        {product.summary.trim() ? (
          <p className="line-clamp-2 text-sm text-muted">{product.summary}</p>
        ) : null}
        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-3 text-xs text-muted">
          {product.material && (
            <>
              <dt>Material</dt>
              <dd className="text-ink">{product.material}</dd>
            </>
          )}
          {cardWeight && (
            <>
              <dt>Vikt</dt>
              <dd className="text-ink">{cardWeight}</dd>
            </>
          )}
          {product.mounting && (
            <>
              <dt>Montering</dt>
              <dd className="text-ink">{product.mounting.join(', ')}</dd>
            </>
          )}
        </dl>
        <p className="pt-2 text-xs font-medium uppercase tracking-[0.08em] text-sage-dark">
          {product.quoteOnRequest ? 'Pris på förfrågan' : 'Pris i offert'}
        </p>
      </div>
    </article>
  )
}
