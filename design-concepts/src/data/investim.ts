import type { Product, SizeOption } from './content'
import catalogFile from './generated/investim-series.json'

const DOCS =
  'Ritningar och datablad publiceras inte på produktsidan. Behöver projektet måttunderlag eller ritning tar vi fram det i offerten.'

const IMAGE_NOTE =
  'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.'

type SeriesJson = {
  slug: string
  name: string
  sku: string
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  material: string
  cement: string | null
  wood: string | null
  dimensions: { label: string; value: string }[]
  weight: string | null
  mounting: string[]
  environment: string
  sizes: {
    name: string
    summary?: string
    weight?: string
    dimensions?: { label: string; value: string }[]
  }[]
  defaultSize: string | null
  sizeLegend: string | null
  ralInQuote: boolean
  related: string[]
  images: { file: string; alt: string }[]
}

const series = catalogFile.series as SeriesJson[]

function toSizes(rows: SeriesJson['sizes']): SizeOption[] | undefined {
  if (!rows.length) return undefined
  return rows.map((r) => ({
    name: r.name,
    summary: r.summary,
    weight: r.weight,
    dimensions: r.dimensions,
  }))
}

function toProduct(row: SeriesJson): Product {
  return {
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    area: 'offentlig',
    category: row.category,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    subcategorySlug: row.subcategorySlug,
    summary: row.summary,
    description: row.description,
    images: row.images.map((img) => ({
      src: `/images/investim/${img.file}`,
      alt: img.alt,
      kind: 'studio' as const,
    })),
    material: row.material,
    cement: row.cement ?? undefined,
    wood: row.wood ?? undefined,
    dimensions: row.dimensions.length ? row.dimensions : undefined,
    weight: row.weight ?? undefined,
    mounting: row.mounting,
    environment: row.environment,
    sizes: toSizes(row.sizes),
    defaultSize: row.defaultSize ?? undefined,
    sizeLegend: row.sizeLegend ?? undefined,
    ralInQuote: row.ralInQuote || undefined,
    related: row.related.slice(0, 3),
    documentPolicy: DOCS,
    imageNote: IMAGE_NOTE,
  }
}

export const investimCatalogSlugs = catalogFile.catalog as {
  parkbankar: string[]
  pollare: string[]
  cykelstall: string[]
  planteringskarl: string[]
  papperskorgar: string[]
  'bord-picknick': string[]
  'modulara-sitt': string[]
}

export const investimProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const INVESTIM_SLUGS = series.map((row) => row.slug)
