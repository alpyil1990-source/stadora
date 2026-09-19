import type { ColorOption, Product, ProductDocument, ProductImage } from './content'
import { VVZ_PLAY_SLUGS, vvzPlayCatalogSlugs } from './catalog-index'
import { normalizeCatalogColors, normalizeCatalogImages } from './gallery'

export { VVZ_PLAY_SLUGS, vvzPlayCatalogSlugs }

type ImageJson = ProductImage & {
  color?: string
  caption?: string
}

type DocJson = ProductDocument

type SeriesJson = {
  slug: string
  name: string
  originalName: string
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
  colorLegend?: string | null
  colors: Array<{ name: string; hex?: string }>
  dimensions: { label: string; value: string; note?: string }[]
  ageRange?: string | null
  users?: string | null
  fallHeight?: string | null
  safetyZoneArea?: string | null
  safetyZonePerimeter?: string | null
  environment?: string | null
  qtyLegend?: string | null
  standards: string[]
  related: string[]
  imageNote?: string
  documentPolicy?: string
  images: ImageJson[]
  documents: DocJson[]
  gaps?: string[]
  contradiction?: string | null
}

function toColors(rows: SeriesJson['colors'], images: ProductImage[]): ColorOption[] | undefined {
  if (!rows.length) return undefined
  return normalizeCatalogColors(
    rows.map((row) => ({ name: row.name, hex: row.hex })),
    images,
  )
}

function toProduct(row: SeriesJson): Product {
  const images = normalizeCatalogImages(
    row.images.map((img) => ({
      src: img.src,
      alt: img.alt,
      kind: img.kind ?? 'studio',
      color: img.color,
      caption: img.caption,
    })),
  )
  const colors = toColors(row.colors, images)
  return {
    slug: row.slug,
    name: row.name,
    originalName: row.originalName,
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
    images,
    material: row.material ?? undefined,
    colorLegend: colors?.length ? (row.colorLegend ?? 'Kulör') : undefined,
    colors,
    dimensions: row.dimensions.length ? row.dimensions : undefined,
    ageRange: row.ageRange ?? undefined,
    users: row.users ?? undefined,
    fallHeight: row.fallHeight ?? undefined,
    safetyZoneArea: row.safetyZoneArea ?? undefined,
    safetyZonePerimeter: row.safetyZonePerimeter ?? undefined,
    environment: row.environment ?? undefined,
    qtyLegend: row.qtyLegend ?? undefined,
    standards: row.standards.length ? row.standards : undefined,
    related: row.related,
    documents: row.documents.map((d) => ({
      title: d.title,
      typeLabel: d.typeLabel,
      format: d.format,
      href: d.href,
      kind: d.kind,
      previewable: Boolean(d.previewable),
      language: d.language,
      originalName: d.originalName,
      sourceUrl: d.sourceUrl,
      fetchedAt: d.fetchedAt,
      appliesTo: d.appliesTo,
      access: d.access,
    })),
    imageNote: row.imageNote,
    documentPolicy: row.documentPolicy,
  }
}

export type VvzPlayGap = {
  slug: string
  name: string
  sku: string
  gaps: string[]
  contradiction: string | null
}

export function buildVvzPlayCatalog(catalogFile: { series?: unknown[] }) {
  const series = (catalogFile.series ?? []) as unknown as SeriesJson[]
  return {
    products: Object.fromEntries(series.map((row) => [row.slug, toProduct(row)])) as Record<string, Product>,
    gaps: series.map((row) => ({
      slug: row.slug,
      name: row.name,
      sku: row.sku,
      gaps: row.gaps ?? [],
      contradiction: row.contradiction ?? null,
    })) as VvzPlayGap[],
  }
}
