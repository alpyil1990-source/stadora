import type { Product, ProductDocument, ProductImage } from './content'
import catalogFile from './generated/novum-series.json'

export type DocumentAccess = 'internal_only' | 'registered_customer' | 'public'

type FileRefJson = {
  fileId: string
  alt?: string
  kind?: ProductImage['kind']
  originalName?: string
  sourceUrl?: string
}

type DocJson = {
  fileId: string
  title: string
  typeLabel: string
  format: string
  kind: ProductDocument['kind']
  access: DocumentAccess
  originalName?: string
  sourceUrl?: string
  appliesTo?: string
}

type SeriesJson = {
  slug: string
  name: string
  originalName: string
  sku: string
  manufacturer: string
  visibility: 'internal_preview' | 'public'
  quoteOnRequest: boolean
  quoteShowsSku?: boolean
  sourceUrl: string
  fetchedAt: string
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  deviceFunction?: string
  material?: string
  colors?: { name: string }[]
  colorLegend?: string
  dimensions: { label: string; value: string }[]
  safetyZoneArea?: string | null
  safetyZonePerimeter?: string | null
  fallHeight?: string | null
  users?: string | null
  ageRange?: string | null
  mounting: string[]
  standards: string[]
  images: FileRefJson[]
  documents: DocJson[]
  related: string[]
  gaps?: string[]
  contradiction?: string | null
}

const series = catalogFile.series as SeriesJson[]

function fileHref(fileId: string) {
  return `/api/files/${fileId}`
}

function toProduct(row: SeriesJson): Product {
  return {
    slug: row.slug,
    name: row.name,
    originalName: row.originalName,
    sku: row.sku,
    manufacturer: row.manufacturer,
    visibility: row.visibility,
    quoteOnRequest: row.quoteOnRequest,
    quoteShowsSku: row.quoteShowsSku,
    sourceUrl: row.sourceUrl,
    fetchedAt: row.fetchedAt,
    area: 'offentlig',
    category: row.category,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    subcategorySlug: row.subcategorySlug,
    summary: row.summary,
    description: row.description,
    deviceFunction: row.deviceFunction,
    material: row.material,
    colors: row.colors,
    colorLegend: row.colorLegend,
    dimensions: row.dimensions,
    safetyZoneArea: row.safetyZoneArea ?? undefined,
    safetyZonePerimeter: row.safetyZonePerimeter ?? undefined,
    fallHeight: row.fallHeight ?? undefined,
    users: row.users ?? undefined,
    ageRange: row.ageRange ?? undefined,
    mounting: row.mounting.length ? row.mounting : undefined,
    standards: row.standards.length ? row.standards : undefined,
    images: row.images.map(
      (img): ProductImage => ({
        src: fileHref(img.fileId),
        fileId: img.fileId,
        alt: img.alt ?? `${row.name}, artikel ${row.sku}`,
        kind: img.kind ?? 'studio',
      }),
    ),
    documents: row.documents.map(
      (d): ProductDocument => ({
        title: d.title,
        typeLabel: d.typeLabel,
        format: d.format,
        href: fileHref(d.fileId),
        fileId: d.fileId,
        kind: d.kind,
        access: d.access,
        originalName: d.originalName,
        sourceUrl: d.sourceUrl,
        appliesTo: d.appliesTo,
        previewable: ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(d.format),
      }),
    ),
    related: row.related,
    imageNote:
      'Intern förhandsgranskning. Originalbilder från leverantören. Kulör på skärm kan avvika.',
  }
}

export const novumProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const NOVUM_SLUGS = series.map((row) => row.slug)

/**
 * Listing slugs for the unpublished Utegym test grid.
 * Products stay internal_preview; this is not publication of the rest of Fitness Devices.
 */
export const novumCatalogSlugs = {
  utegym: [...NOVUM_SLUGS],
}

export const novumGaps = series.map((row) => ({
  slug: row.slug,
  name: row.name,
  sku: row.sku,
  gaps: row.gaps ?? [],
  contradiction: row.contradiction ?? null,
}))
