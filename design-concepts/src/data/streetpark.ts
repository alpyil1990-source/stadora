import type { ColorOption, Product, ProductDocument, ProductImage, SizeOption } from './content'
import catalogFile from './generated/streetpark-series.json'
import { finishSwatchHex } from './streetpark-finishes'

const GALLERY_LOCKED_NOTE =
  'Bilden visar ett exempelutförande. Kulör på skärm kan avvika. Modellvalet ändrar dokument, inte bildgalleriet.'

type DocJson = {
  title: string
  typeLabel: string
  format: string
  href: string
  sourceUrl?: string
  fetchedAt?: string
  variant?: string | null
  kind: ProductDocument['kind']
  previewable?: boolean
  appliesTo?: string | null
}

type SeriesJson = {
  slug: string
  name: string
  modelName: string
  sku: string | null
  manufacturer: string
  quoteShowsSku: boolean
  sourceUrl: string
  fetchedAt: string
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  material: string | null
  dimensions: { label: string; value: string }[]
  weight: string | null
  mounting: string[]
  sizes: {
    name: string
    sku?: string
    summary?: string | null
    dimensions?: { label: string; value: string }[]
    weight?: string | null
    icon?: string | null
    iconSourceUrl?: string | null
  }[]
  defaultSize: string | null
  sizeLegend: string | null
  colorLegend?: string | null
  colors: Array<
    | string
    | {
        name: string
        hex?: string
        swatch?: string
        swatchSourceUrl?: string
        code?: string
      }
  >
  variants: { label: string; options: string[]; optionSwatches?: Record<string, string> }[]
  related: string[]
  images: {
    src: string
    alt: string
    kind?: ProductImage['kind']
    size?: string
  }[]
  documents: DocJson[]
  imageNote?: string
}

const series = catalogFile.series as SeriesJson[]

function toSizes(rows: SeriesJson['sizes']): SizeOption[] | undefined {
  if (!rows.length) return undefined
  return rows.map((r) => ({
    name: r.name,
    sku: r.sku,
    summary: r.summary ?? undefined,
    dimensions: r.dimensions,
    weight: r.weight ?? undefined,
    icon: r.icon ?? undefined,
  }))
}

function toColors(rows: SeriesJson['colors']): ColorOption[] | undefined {
  if (!rows.length) return undefined
  return rows.map((row) => {
    const name = typeof row === 'string' ? row : row.name
    const swatch = typeof row === 'string' ? undefined : row.swatch
    const hex = (typeof row === 'string' ? undefined : row.hex) ?? finishSwatchHex(name)
    return { name, hex, swatch }
  })
}

function publicAppliesTo(text?: string | null) {
  if (!text) return undefined
  let next = text.replace(/Fil från STREETPARK-arkivet /g, 'Fil från arkivet ')
  next = next.replace(/Gäller materialval som STREETPARK listar för produkten\.?/g, 'Gäller materialval som listats för produkten.')
  next = next.replace(/Gäller STREETPARKs sortiment enligt dokumentet\.?/g, 'Gäller sortimentet enligt dokumentet.')
  next = next.replace(/Gäller serien enligt STREETPARKs nedladdning\.?/g, 'Gäller serien enligt nedladdningen.')
  next = next.replace(/STREETPARKs\s+/g, '').replace(/STREETPARK\s+/g, '')
  return next.trim() || undefined
}

function toDocs(rows: DocJson[]): ProductDocument[] {
  return rows.map((d) => ({
    title: d.title,
    typeLabel: d.typeLabel,
    format: d.format,
    href: d.href,
    kind: d.kind,
    previewable: Boolean(d.previewable ?? ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(d.format)),
    variant: d.variant ?? undefined,
    appliesTo: publicAppliesTo(d.appliesTo),
    sourceUrl: d.sourceUrl,
    fetchedAt: d.fetchedAt,
  }))
}

function publicDescription(text: string) {
  let next = text.replace(/\s*Tillverkare:\s*STREETPARK\.?/g, '')
  next = next.replace(/från STREETPARKs kulörkarta/g, 'från kulörkartan')
  next = next.replace(/STREETPARK anger att\s+([a-zåäö])/gi, (_, ch: string) => ch.toUpperCase())
  next = next.replace(/STREETPARK anger att\s+/g, '')
  next = next.replace(/STREETPARK anger användningen för\s+/g, 'Användning för ')
  next = next.replace(/STREETPARK anger användning för\s+/g, 'Användning för ')
  next = next.replace(/STREETPARK anger användning vid\s+/g, 'Användning vid ')
  next = next.replace(/STREETPARK anger placering i\s+/g, 'Placering i ')
  next = next.replace(/STREETPARK anger yttermått\s+/g, 'Yttermått ')
  next = next.replace(/STREETPARK beskriver den som\s+([a-zåäö])/gi, (_, ch: string) => ch.toUpperCase())
  next = next.replace(/STREETPARK beskriver den som\s+/g, '')
  next = next.replace(/STREETPARKs\s+/g, '')
  next = next.replace(/STREETPARK\s+/g, '')
  next = next.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim()
  return next
}

function publicSummary(text: string) {
  return text.replace(/\s*STREETPARKs\s+/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function publicMounting(items: string[]) {
  return items.map((item) =>
    item.replace(/\s+enligt STREETPARKs underlag\.?/g, '.').replace(/\.\./g, '.'),
  )
}

function toProduct(row: SeriesJson): Product {
  return {
    slug: row.slug,
    name: row.name,
    sku: row.sku ?? undefined,
    manufacturer: row.manufacturer,
    quoteShowsSku: row.quoteShowsSku || undefined,
    sourceUrl: row.sourceUrl,
    fetchedAt: row.fetchedAt,
    area: 'offentlig',
    category: row.category,
    categorySlug: row.categorySlug,
    subcategory: row.subcategory,
    subcategorySlug: row.subcategorySlug,
    summary: publicSummary(row.summary),
    description: publicDescription(row.description),
    images: row.images.map((img) => ({
      src: img.src,
      alt: img.alt,
      kind: img.kind ?? 'studio',
    })),
    material: row.material ?? undefined,
    dimensions: row.dimensions.length ? row.dimensions : undefined,
    weight: row.weight ?? undefined,
    mounting: row.mounting.length ? publicMounting(row.mounting) : undefined,
    sizes: toSizes(row.sizes),
    defaultSize: row.defaultSize ?? undefined,
    sizeLegend: row.sizeLegend ?? undefined,
    colorLegend: row.colorLegend ?? (row.colors.length ? 'Kulör på metall' : undefined),
    colors: toColors(row.colors),
    variants: row.variants.length ? row.variants : undefined,
    related: row.related.slice(0, 3),
    documents: toDocs(row.documents),
    imageNote: GALLERY_LOCKED_NOTE,
  }
}

export const streetparkCatalogSlugs = {
  parkbankar: catalogFile.catalog.parkbankar as string[],
  papperskorgar: catalogFile.catalog.papperskorgar as string[],
  askkoppar: catalogFile.catalog.askkoppar as string[],
  cykelstall: catalogFile.catalog.cykelstall as string[],
  'bord-picknick': catalogFile.catalog['bord-picknick'] as string[],
  pollare: catalogFile.catalog.pollare as string[],
  sitto: ((catalogFile.catalog as { sitto?: string[] }).sitto ?? []) as string[],
}

export const streetparkProducts: Record<string, Product> = Object.fromEntries(
  series.map((row) => [row.slug, toProduct(row)]),
)

export const STREETPARK_SLUGS = series.map((row) => row.slug)
