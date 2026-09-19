import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { isStadoraArticleNumber, productPath } from '../data/content'

export function listingFacts(product: Product) {
  const facts: { label: string; value: string }[] = []
  if (product.ageRange) facts.push({ label: 'Ålder', value: product.ageRange })
  if (product.users) facts.push({ label: 'Användare', value: product.users })
  if (product.fallHeight) facts.push({ label: 'Fallhöjd', value: product.fallHeight })
  else if (product.safetyZoneArea) {
    facts.push({ label: 'Säkerhetsområde', value: product.safetyZoneArea })
  }
  return facts.slice(0, 3)
}

/** Compact catalog card for Lek och aktivitet listings. Not used on product pages. */
export function ListingCard({ product }: { product: Product }) {
  const img = product.images.find((image) => image.kind === 'studio') ?? product.images[0]
  const facts = listingFacts(product)
  return (
    <Link
      to={productPath(product)}
      className="group flex h-full flex-col border border-line bg-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-paper">
        {img && (
          <img
            src={img.src}
            alt={img.alt}
            className="absolute inset-0 h-full w-full object-contain p-1.5 sm:p-2"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <p className="kicker">{product.subcategory}</p>
        <h3 className="mt-1 text-lg font-medium leading-snug">{product.name}</h3>
        {(isStadoraArticleNumber(product.sku) || product.visibility === 'internal_preview') &&
        product.sku ? (
          <p className="mt-1 font-ui text-xs tabular-nums text-muted">{product.sku}</p>
        ) : null}
        {facts.length > 0 && (
          <dl className="mt-2 space-y-0.5 text-xs text-muted">
            {facts.map((f) => (
              <div key={f.label} className="flex justify-between gap-3">
                <dt>{f.label}</dt>
                <dd className="tabular-nums text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-auto flex items-baseline justify-between gap-3 pt-3 text-xs">
          <span className="font-ui font-semibold uppercase tracking-[0.08em] text-sage-dark">
            Pris på förfrågan
          </span>
          <span className="text-ink group-hover:underline">Visa produkt</span>
        </p>
      </div>
    </Link>
  )
}
