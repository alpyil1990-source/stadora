import { Navigate, useParams } from 'react-router-dom'
import { ProductView, type ProductLayout } from '../components/ProductView'
import { products } from '../data/content'

export function ProductPage({ layout, slug }: { layout?: ProductLayout; slug?: string }) {
  const params = useParams()
  const key = slug ?? params.slug ?? 'parkbank-arsta'
  const product = products[key]
  if (!product) return <Navigate to="/" replace />
  return <ProductView product={product} layout={layout ?? 'hybrid'} />
}

export function ProductLayoutA() {
  return <ProductView product={products['parkbank-arsta']} layout="spec" />
}

export function ProductLayoutB() {
  return <ProductView product={products['parkbank-arsta']} layout="visual" />
}
