import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { productPath } from '../data/content'
import { useTheme } from '../context/ThemeContext'

export function ProductCard({
  product,
  featured = false,
}: {
  product: Product
  featured?: boolean
}) {
  const img = product.images[0]
  const { theme } = useTheme()
  const atelje = theme === 'atelje'

  return (
    <article className={`product-card flex h-full flex-col border border-line bg-sheet ${featured ? 'featured' : ''}`}>
      <Link to={productPath(product)} className="card-media block aspect-[5/4] bg-paper">
        {img && (
          <img src={img.src} alt={img.alt} className="h-full w-full object-contain p-4" />
        )}
      </Link>
      <div className="card-body flex flex-1 flex-col gap-2 p-4">
        <p className="kicker">{product.subcategory}</p>
        <h3 className={`leading-snug ${atelje ? 'display text-2xl' : 'text-lg font-medium'}`}>
          <Link to={productPath(product)} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.sku && (
          <p className="font-ui text-xs tabular-nums text-muted">Art.nr {product.sku}</p>
        )}
        {(!atelje || featured) && <p className="text-sm text-muted">{product.summary}</p>}
        <dl className="card-specs mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-3 text-xs text-muted">
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
