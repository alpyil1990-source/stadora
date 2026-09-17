import type { Product, ProductDocument, ProductImage, SizeOption } from './content'
import catalogFile from './generated/inoplex-series.json'

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
  options: OptJson[]
}

type SeriesJson = {
  slug: string
  name: string
  modelName: string
  sku: string
  sourceUrl: string
  fetchedAt: string
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  quoteShowsSku: boolean
  quoteOnRequest: boolean
  sizes: SizeOption[]
  defaultSize: string | null
  sizeLegend: string | null
  optionGroups: GroupJson[]
  mounting: string[]
  images: ProductImage[]
  documents: ProductDocument[]
  related: string[]
  imageNote?: string
  gaps?: string[]
}

const series = catalogFile.series as unknown as SeriesJson[]

function toProduct(row: SeriesJson): Product {
  return {
    slug: row.slug,
    name: row.name,
    sku: row.sku,
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
    })),
    dimensions: row.sizes[0]?.dimensions,
    mounting: row.mounting.length ? row.mounting : undefined,
    sizes: row.sizes.length > 1 ? row.sizes : undefined,
    defaultSize: row.defaultSize ?? undefined,
    sizeLegend: row.sizes.length > 1 ? (row.sizeLegend ?? 'Mått') : undefined,
    optionGroups: row.optionGroups.map((g) => ({
      key: g.key,
      label: g.label,
      kind: g.kind,
      parentKey: g.parentKey,
      parentValue: g.parentValue,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        swatch: o.swatch ?? undefined,
        customText: o.customText || undefined,
      })),
    })),
    related: row.related.slice(0, 4),
    documents: row.documents,
    imageNote: row.imageNote,
  }
}

function slugsFor(sub: string) {
  return series.filter((r) => r.subcategorySlug === sub).map((r) => r.slug)
}

export const inoplexCatalogSlugs = {
  parkbankar: slugsFor('parkbankar'),
  'modulara-sitt': slugsFor('modulara-sitt'),
  'bord-picknick': slugsFor('bord-picknick'),
  papperskorgar: slugsFor('papperskorgar'),
  askkoppar: slugsFor('askkoppar'),
  kallsortering: slugsFor('kallsortering'),
  planteringskarl: slugsFor('planteringskarl'),
  cykelstall: slugsFor('cykelstall'),
  'tak-skydd': slugsFor('tak-skydd'),
  'garage-service': slugsFor('garage-service'),
  pollare: slugsFor('pollare'),
}

export const inoplexProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const INOPLEX_SLUGS = series.map((row) => row.slug)

export const inoplexGaps = series.map((row) => ({
  slug: row.slug,
  name: row.name,
  gaps: row.gaps ?? [],
}))
