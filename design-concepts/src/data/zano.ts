import type { Product, ProductDocument, ProductImage } from './content'
import { ZANO_SLUGS, zanoCatalogSlugs } from './catalog-index'

export { ZANO_SLUGS, zanoCatalogSlugs }

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
  weightByOption?: Record<string, string> | null
  mounting: string[]
  optionGroups: GroupJson[]
  images: ProductImage[]
  documents: DocJson[]
  related: string[]
  imageNote?: string
  reviewNote?: string
  gaps?: string[]
  listingSrc?: string | null
}

const HIDDEN_SUBCATEGORY_SLUGS = new Set(['solkraftverk'])

/** Old Solkraftsverk product URLs. Category is removed from the catalog. */
export const ZANO_REMOVED_PRODUCT_REDIRECTS: Record<string, string> = {
  'solkraftstation-scandik-19-046': '/produkter/parkmobler',
  'solkraftstation-sunflower-19-001': '/produkter/parkmobler',
  'solkraftstation-universe-19-055': '/produkter/parkmobler',
}

const MAKER_LINE = 'Tillverkare: Zano.'

function publicName(row: SeriesJson): string {
  const model = row.modelName?.trim()
  if (model) return model
  return row.name.replace(/\s*[–—-]\s*ZANO\s*$/i, '').trim()
}

function stripMakerBoilerplate(text: string): string {
  return text
    .replace(/\s*från tillverkaren ZANO/gi, '')
    .replace(/\s*Tillverkare:\s*ZANO\.?/gi, '')
    .replace(/\s*Tillverkare:\s*Zano\.?/gi, '')
    .replace(/\boffererar ZANO\b/gi, 'offereras')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
}

function withMakerLine(text: string): string {
  const body = stripMakerBoilerplate(text)
  if (/^Tillverkare:\s*Zano\b/i.test(body)) return body
  return body ? `${MAKER_LINE} ${body}` : MAKER_LINE
}

function publicSummary(row: SeriesJson, name: string): string {
  const stripped = stripMakerBoilerplate(row.summary)
  const leftover = stripped.replace(/\.+$/, '').trim()
  if (!leftover || leftover.toLowerCase() === name.toLowerCase()) return ''
  return stripped
}

function toProduct(row: SeriesJson, hiddenSlugs: Set<string>): Product {
  const name = publicName(row)
  return {
    slug: row.slug,
    name,
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
    summary: publicSummary(row, name),
    description: withMakerLine(row.description),
    images: row.images.map((img) => ({
      src: img.src,
      alt: img.alt.replace(/\s*[–—-]\s*ZANO(?=,|$)/gi, ''),
      kind: img.kind ?? 'studio',
      color: img.color,
    })),
    material: row.material ?? undefined,
    wood: row.wood ? stripMakerBoilerplate(row.wood) : undefined,
    dimensions: row.dimensions.length ? row.dimensions : undefined,
    weight: row.weight ?? undefined,
    weightSummary: row.weightSummary ?? undefined,
    weightByOption: row.weightByOption ?? undefined,
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
    related: row.related.filter((slug) => !hiddenSlugs.has(slug)),
    listingSrc:
      row.listingSrc ??
      (row.subcategorySlug === 'parkbankar'
        ? `/images/zano/${row.slug}/listing.jpg`
        : undefined),
    documents: row.documents
      .filter((d) => !/^Seriebroschyr/i.test(d.typeLabel) && !/\/seriebroschyr\.pdf$/i.test(d.href))
      .map((d) => ({
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
        language: d.language,
      })),
    imageNote: row.imageNote,
    reviewNote: row.reviewNote,
  }
}

export type ZanoQc = {
  checkedAt?: string
  products?: number
  complete?: number
  incomplete?: { sku?: string; name: string; gaps: string[] }[]
  withoutSwedishDatasheet?: { sku?: string; name: string; documents: number }[]
  withoutDocuments?: { sku?: string; name: string }[]
  overlapNoSwedishDatasheetAndNoDocuments?: { sku?: string; name: string }[]
  picnicSets?: {
    slug: string
    title?: string
    ownSku?: string | null
    memberSkus?: string[]
    note?: string
  }[]
}

export type ZanoGap = { slug: string; name: string; gaps: string[] }

export function buildZanoCatalog(catalogFile: { series?: unknown[]; qc?: ZanoQc }) {
  const allSeries = (catalogFile.series ?? []) as unknown as SeriesJson[]
  const hiddenSlugs = new Set(
    allSeries.filter((row) => HIDDEN_SUBCATEGORY_SLUGS.has(row.subcategorySlug)).map((row) => row.slug),
  )
  const series = allSeries.filter((row) => !HIDDEN_SUBCATEGORY_SLUGS.has(row.subcategorySlug))
  const removedRedirects: Record<string, string> = { ...ZANO_REMOVED_PRODUCT_REDIRECTS }
  for (const slug of hiddenSlugs) {
    if (!(slug in removedRedirects)) removedRedirects[slug] = '/produkter/parkmobler'
  }
  return {
    products: Object.fromEntries(series.map((row) => [row.slug, toProduct(row, hiddenSlugs)])) as Record<
      string,
      Product
    >,
    gaps: series.map((row) => ({
      slug: row.slug,
      name: row.name,
      gaps: row.gaps ?? [],
    })) as ZanoGap[],
    qc: (catalogFile.qc ?? {}) as ZanoQc,
    removedRedirects,
  }
}
