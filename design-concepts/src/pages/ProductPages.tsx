import { Navigate, useParams } from 'react-router-dom'
import { ProductView, type ProductLayout } from '../components/ProductView'
import { products } from '../data/content'
import { KUSCH_VCARE_FOLD_REDIRECTS } from '../data/kusch-vcare-fold'

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
  const redirected = KUSCH_VCARE_FOLD_REDIRECTS[key]
  if (redirected) {
    return <Navigate to={intern ? `/intern/produkt/${redirected}` : `/produkt/${redirected}`} replace />
  }
  const product = products[key]
  if (!product) return <Navigate to="/" replace />
  if (product.visibility === 'internal_preview' && !intern) {
    return <Navigate to={`/intern/produkt/${product.slug}`} replace />
  }
  return <ProductView product={product} layout={layout ?? 'hybrid'} intern={intern} />
}

export function ProductLayoutA() {
  return <ProductView product={products['parkbank-arsta']} layout="spec" />
}

export function ProductLayoutB() {
  return <ProductView product={products['parkbank-arsta']} layout="visual" />
}
