import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { productPath } from '../data/content'

export function ProductCard({ product }: { product: Product }) {
  const img = product.images[0]
  return (
    <article className="flex flex-col border border-line bg-sheet">
      <Link to={productPath(product)} className="block aspect-[5/4] bg-paper">
        {img && (
          <img src={img.src} alt={img.alt} className="h-full w-full object-contain p-4" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="kicker">{product.subcategory}</p>
        <h3 className="text-lg font-medium leading-snug">
          <Link to={productPath(product)} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.sku && !product.materials?.length && (
          <p className="font-ui text-xs tabular-nums text-muted">Art.nr {product.sku}</p>
        )}
        {product.materials && product.materials.length > 0 && (
          <p className="font-ui text-xs tabular-nums text-muted">
            Art.nr {product.materials.map((m) => m.sku).join(' · ')}
          </p>
        )}
        <p className="text-sm text-muted">{product.summary}</p>
        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-3 text-xs text-muted">
          {product.material && (
            <>
              <dt>Material</dt>
              <dd className="text-ink">{product.material}</dd>
            </>
          )}
          {product.weight && (
            <>
              <dt>Vikt</dt>
              <dd className="text-ink">{product.weight}</dd>
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
          Pris i offert
        </p>
      </div>
    </article>
  )
}
