import type { Product, ProductDocument, ProductImage, SizeOption } from './content'
import catalogFile from './generated/kusch-vcare-fold.json'

type OptJson = {
  id: string
  name: string
  swatch?: string | null
  customText?: boolean
}

type GroupJson = {
  key: string
  label: string
  kind: 'choice' | 'swatch'
  parentKey?: string
  parentValue?: string
  hint?: string
  options: OptJson[]
}

type ImageJson = ProductImage & {
  utforande?: string
  caption?: string
}

type SeriesJson = {
  slug: string
  name: string
  sku: string
  manufacturer: string
  quoteShowsSku: boolean
  quoteOnRequest: boolean
  sourceUrl: string
  fetchedAt: string
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  material?: string | null
  wood?: string | null
  environment?: string | null
  qtyLegend?: string | null
  sizes: SizeOption[]
  defaultSize: string | null
  sizeLegend: string | null
  optionGroups: GroupJson[]
  images: ImageJson[]
  documents: ProductDocument[]
  related: string[]
  imageNote?: string
  documentPolicy?: string
  mounting: string[]
  standards?: string[]
}

const series = catalogFile.series as unknown as SeriesJson[]

function toProduct(row: SeriesJson): Product {
  return {
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    manufacturer: row.manufacturer,
    quoteShowsSku: row.quoteShowsSku || undefined,
    quoteOnRequest: row.quoteOnRequest || undefined,
    sourceUrl: row.sourceUrl,
    fetchedAt: row.fetchedAt,
    area: 'offentlig',
    category: row.category,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    subcategorySlug: row.subcategorySlug,
    summary: row.summary,
    description: row.description,
    images: row.images.map((img) => ({
      src: img.src,
      alt: img.alt,
      kind: img.kind ?? 'studio',
      color: img.color,
      size: img.size,
      utforande: img.utforande,
      caption: img.caption,
    })),
    material: row.material ?? undefined,
    wood: row.wood ?? undefined,
    environment: row.environment ?? undefined,
    qtyLegend: row.qtyLegend ?? undefined,
    mounting: row.mounting.length ? row.mounting : undefined,
    standards: row.standards,
    sizes: row.sizes.length ? row.sizes : undefined,
    defaultSize: row.defaultSize ?? undefined,
    sizeLegend: row.sizes.length ? (row.sizeLegend ?? 'Antal sittplatser') : undefined,
    optionGroups: row.optionGroups.map((g) => ({
      key: g.key,
      label: g.label,
      kind: g.kind,
      parentKey: g.parentKey,
      parentValue: g.parentValue,
      hint: g.hint,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        swatch: o.swatch ?? undefined,
        customText: o.customText || undefined,
      })),
    })),
    related: row.related,
    documents: row.documents,
    imageNote: row.imageNote,
    documentPolicy: row.documentPolicy,
  }
}

function slugsFor(sub: string) {
  return series.filter((r) => r.subcategorySlug === sub).map((r) => r.slug)
}

export const kuschCatalogSlugs = {
  'vagghangda-fallstolar': slugsFor('vagghangda-fallstolar'),
}

export const kuschVcareFoldProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const KUSCH_VCARE_FOLD_SLUGS = series.map((row) => row.slug)

export const KUSCH_VCARE_FOLD_REDIRECTS: Record<string, string> = {
  'v-care-fold-1u-mw-w': 'v-care-fold',
  'v-care-fold-1u-mw-uph': 'v-care-fold',
  'v-care-fold-2u-3u-mw-w': 'v-care-fold',
  'v-care-fold-2u-3u-mw-uph': 'v-care-fold',
}

export function isKuschFoldProduct(product?: { slug?: string; manufacturer?: string } | null) {
  if (!product) return false
  if (product.slug === 'v-care-fold') return true
  if (product.slug && product.slug in KUSCH_VCARE_FOLD_REDIRECTS) return true
  return product.manufacturer === 'Kusch+Co'
}

export function kuschFoldSku(seatsName?: string, utforande?: string) {
  const seats = seatsName?.match(/(\d+)/)?.[1]
  if (!seats) return undefined
  const upholstered = utforande === 'Klädd'
  return `VCARE FOLD ${seats}U MW ${upholstered ? 'UPH' : 'W'}`
}

export function kuschFoldSeatMaterial(state: Record<string, string>): string | undefined {
  const utforande = state['Utförande']
  if (utforande === 'Klädd') {
    const collection = state['Klädselkollektion']
    const wish = state['Klädselkulör::egen']?.trim()
    const colour = wish || state['Klädselkulör']
    const bits = [collection, colour].filter(Boolean)
    const base = bits.length ? bits.join(', ') : 'Klädd sits och rygg'
    return `${base}. Sits och rygg samma klädselkulör.`
  }
  if (utforande !== 'Trä') return undefined
  const finish = state['Ytbehandling']
  if (finish === 'Naturbok') {
    return 'Bokplywood, SKNB Natur bok. Sits och rygg samma kulör. Ek och valnöt i paletten är betsnamn, inte alternativa träslag.'
  }
  if (finish === 'Betsat') {
    const stain = state['Träkulör']
    const named = stain ? `Bokplywood, ${stain}` : 'Bokplywood, betsat'
    return `${named}. Sits och rygg samma kulör. Ek och valnöt är betsnamn, inte alternativa träslag.`
  }
  if (finish === 'Laminat') {
    const lam = state['Laminatkulör']
    const named = lam ? `Laminat, ${lam}` : 'Laminat'
    return `${named}. Sits och rygg samma kulör.`
  }
  return 'Sits och rygg i trä, samma kulör.'
}
