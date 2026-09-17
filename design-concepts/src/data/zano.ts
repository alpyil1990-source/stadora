import type { Product, ProductDocument, ProductImage } from './content'
import catalogFile from './generated/zano-series.json'

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

type DocJson = ProductDocument

type SeriesJson = {
  slug: string
  name: string
  modelName: string
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
  material: string | null
  wood?: string | null
  dimensions: { label: string; value: string; note?: string }[]
  weight: string | null
  weightSummary?: string | null
  mounting: string[]
  optionGroups: GroupJson[]
  images: ProductImage[]
  documents: DocJson[]
  related: string[]
  imageNote?: string
  reviewNote?: string
  gaps?: string[]
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
    })),
    material: row.material ?? undefined,
    wood: row.wood ?? undefined,
    dimensions: row.dimensions.length ? row.dimensions : undefined,
    weight: row.weight ?? undefined,
    weightSummary: row.weightSummary ?? undefined,
    mounting: row.mounting.length ? row.mounting : undefined,
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
    documents: row.documents.map((d) => ({
      title: d.title,
      typeLabel: d.typeLabel,
      format: d.format,
      href: d.href,
      kind: d.kind,
      previewable: ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(d.format),
      variant: d.variant ?? undefined,
      appliesTo: d.appliesTo,
      sourceUrl: d.sourceUrl,
      fetchedAt: d.fetchedAt,
    })),
    imageNote: row.imageNote,
    reviewNote: row.reviewNote,
  }
}

export const zanoCatalogSlugs = {
  solstolar: series.filter((r) => r.subcategorySlug === 'solstolar').map((r) => r.slug),
}

export const zanoProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const ZANO_SLUGS = series.map((row) => row.slug)

export const zanoGaps = series.map((row) => ({
  slug: row.slug,
  name: row.name,
  gaps: row.gaps ?? [],
}))
