import type { Product, ProductDocument, ProductImage, SizeOption } from './content'
import { INOPLEX_SLUGS, inoplexCatalogSlugs } from './catalog-index'

export { INOPLEX_SLUGS, inoplexCatalogSlugs }

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

/** Old park-bench URLs for architectural-concrete planters (DOB.21). */
export const INOPLEX_SLUG_REDIRECTS: Record<string, string> = {
  'parkbank-dob-21-01': 'planteringskarl-dob-21-01',
  'parkbank-dob-21-02': 'planteringskarl-dob-21-02',
  'parkbank-dob-21-03': 'planteringskarl-dob-21-03',
  'parkbank-dob-21-04': 'planteringskarl-dob-21-04',
  'parkbank-dob-21-05': 'planteringskarl-dob-21-05',
  'parkbank-dob-21-06': 'planteringskarl-dob-21-06',
}

export type InoplexGap = { slug: string; name: string; gaps: string[] }

export function buildInoplexCatalog(catalogFile: { series?: unknown[] }) {
  const series = (catalogFile.series ?? []) as unknown as SeriesJson[]
  return {
    products: Object.fromEntries(series.map((row) => [row.slug, toProduct(row)])) as Record<string, Product>,
    gaps: series.map((row) => ({
      slug: row.slug,
      name: row.name,
      gaps: row.gaps ?? [],
    })) as InoplexGap[],
  }
}
