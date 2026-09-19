import { Navigate, useParams } from 'react-router-dom'
import { ProductView, type ProductLayout } from '../components/ProductView'
import { CatalogError, CatalogLoading } from '../components/CatalogStatus'
import { useProductCatalog } from '../context/ProductCatalogContext'
import { products as coreProducts } from '../data/content'
import { INOPLEX_SLUG_REDIRECTS } from '../data/inoplex'
import { KUSCH_VCARE_FOLD_REDIRECTS } from '../data/kusch-vcare-fold'
import { ZANO_REMOVED_PRODUCT_REDIRECTS } from '../data/zano'

export function ProductPage({
  layout,
  slug,
  intern = false,
}: {
  layout?: ProductLayout
  slug?: string
  intern?: boolean
}) {
  const params = useParams()
  const key = slug ?? params.slug ?? 'parkbank-arsta'
  const { products, status, error, reload, zanoRemovedRedirects } = useProductCatalog()
  const removed = ZANO_REMOVED_PRODUCT_REDIRECTS[key] ?? zanoRemovedRedirects[key]
  if (removed) {
    return <Navigate to={removed} replace />
  }
  const redirected = KUSCH_VCARE_FOLD_REDIRECTS[key] ?? INOPLEX_SLUG_REDIRECTS[key]
  if (redirected) {
    return <Navigate to={intern ? `/intern/produkt/${redirected}` : `/produkt/${redirected}`} replace />
  }
  const product = products[key]
  if (!product) {
    if (status === 'loading') return <CatalogLoading title="Laddar produkten…" />
    if (status === 'error') return <CatalogError message={error} onRetry={reload} />
    return <Navigate to="/" replace />
  }
  if (product.visibility === 'internal_preview' && !intern) {
    const category = product.categorySlug
    const sub = product.subcategorySlug
    return (
      <Navigate
        to={category && sub ? `/produkter/${category}/${sub}` : '/produkter'}
        replace
      />
    )
  }
  return <ProductView product={product} layout={layout ?? 'hybrid'} intern={intern} />
}

export function ProductLayoutA() {
  return <ProductView product={coreProducts['parkbank-arsta']} layout="spec" />
}

export function ProductLayoutB() {
  return <ProductView product={coreProducts['parkbank-arsta']} layout="visual" />
}
