import type { MaterialFinish, Product, SizeOption } from './content'
import catalogFile from './generated/avfall-series.json'

const DOCS =
  'Ritningar och datablad publiceras inte på produktsidan. Behöver projektet måttunderlag eller ritning tar vi fram det i offerten.'

const LEAD =
  'Cirka 5 veckor från orderbekräftelse (förskottsbetalning). Kan justeras vid större volym.'

const WARRANTY = '12 månader från leverans.'

const IMAGE_NOTE =
  'Bilden visar ett exempelutförande. Ingen unik produktbild per RAL-kulör eller per kapacitet. Färgåtergivning på skärm kan avvika.'

type SeriesJson = {
  slug: string
  name: string
  sku: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  images: { file: string; alt: string }[]
  material: string
  defaultSize: string
  sizes: { name: string; dim: string; capacity: string; dimLabel: string }[]
  materials: {
    name: string
    code: 'PC' | 'SST'
    sku: string
    environment: string
    standardFeatures: string[]
    optionalFeatures: string[]
  }[]
  variants: { label: string; options: string[] }[]
  related: string[]
}

const series = catalogFile.series as SeriesJson[]

function toSizes(rows: SeriesJson['sizes']): SizeOption[] {
  return rows.map((r) => ({
    name: r.name,
    summary: r.capacity,
    capacity: r.capacity,
    dimensions: [{ label: r.dimLabel, value: r.dim }],
  }))
}

function toMaterials(rows: SeriesJson['materials']): MaterialFinish[] {
  return rows.map((m) => ({
    name: m.name,
    code: m.code,
    sku: m.sku,
    environment: m.environment,
    standardFeatures: m.standardFeatures,
    optionalFeatures: m.optionalFeatures,
  }))
}

function toProduct(row: SeriesJson): Product {
  const related = [...row.related]
  if (row.subcategorySlug === 'papperskorgar' && !related.includes('papperskorg-rodberga-100')) {
    related.unshift('papperskorg-rodberga-100')
  }
  return {
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    area: 'offentlig',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: row.subcategory,
    subcategorySlug: row.subcategorySlug,
    summary: row.summary,
    description: row.description,
    images: row.images.map((img) => ({
      src: `/images/avfall/${img.file}`,
      alt: img.alt,
      kind: 'studio' as const,
    })),
    material: row.material,
    defaultSize: row.defaultSize,
    sizes: toSizes(row.sizes),
    materials: toMaterials(row.materials),
    variants: row.variants,
    related: related.slice(0, 3),
    leadTime: LEAD,
    warranty: WARRANTY,
    ralInQuote: true,
    sizeLegend: 'Kapacitet',
    documentPolicy: DOCS,
    imageNote: IMAGE_NOTE,
  }
}

export const avfallCatalogSlugs = catalogFile.catalog as {
  askkoppar: string[]
  kallsortering: string[]
  papperskorgar: string[]
}

export const binsigniaRestProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const BINSIGNIA_REST_SLUGS = series.map((row) => row.slug)
