import type { Product, SizeOption } from './content'
import { productPath } from './content'
import { selectedMaterial } from './binsignia'
import { initialOptionState, optionQuoteBits } from './inoplex-config'
import { isKuschFoldProduct, kuschFoldSku } from './kusch-vcare-fold'

/** Internal state key for type/size. STREETPARK's public legend is "Modell". */
export const SIZE_VARIANT_KEY = 'Storlek'
export const COLOR_VARIANT_KEY = 'Kulör'

export function initialVariantState(product: Product): Record<string, string> {
  const init: Record<string, string> = { ...initialOptionState(product) }
  product.variants?.forEach((v) => {
    if (init[v.label] == null) init[v.label] = v.options[0]
  })
  const typeName = product.defaultSize ?? product.sizes?.[0]?.name
  if (typeName) init[SIZE_VARIANT_KEY] = typeName
  if (product.materials?.length) {
    init['Material'] = product.defaultMaterial ?? product.materials[0].name
  }
  return init
}

export function selectedTypeName(
  product: Product,
  variants: Record<string, string>,
): string | undefined {
  return (
    variants[SIZE_VARIANT_KEY] ||
    (product.sizeLegend ? variants[product.sizeLegend] : undefined) ||
    product.defaultSize ||
    product.sizes?.[0]?.name
  )
}

export function selectedTypeOption(
  product: Product,
  variants: Record<string, string>,
): SizeOption | undefined {
  const name = selectedTypeName(product, variants)
  if (!name) return undefined
  return product.sizes?.find((s) => s.name === name || s.sku === name)
}

export function withSelectedType(
  variants: Record<string, string>,
  name: string,
  sizeLegend?: string,
): Record<string, string> {
  const next: Record<string, string> = { ...variants, [SIZE_VARIANT_KEY]: name }
  if (sizeLegend && sizeLegend !== SIZE_VARIANT_KEY) delete next[sizeLegend]
  return next
}

export function quoteLineSku(product: Product, variants: Record<string, string>): string | undefined {
  if (isKuschFoldProduct(product)) {
    return kuschFoldSku(selectedTypeName(product, variants)) ?? product.sku
  }
  const finish = selectedMaterial(product, variants['Material'])
  const size = selectedTypeOption(product, variants)
  return finish?.sku ?? size?.sku ?? size?.name ?? product.sku
}

export function quoteLineVariant(
  product: Product,
  variants: Record<string, string>,
  ral?: string,
): string | undefined {
  const typeName = selectedTypeName(product, variants)
  const color = variants[COLOR_VARIANT_KEY]
  const skip = new Set<string>([SIZE_VARIANT_KEY, COLOR_VARIANT_KEY])
  if (product.sizeLegend) skip.add(product.sizeLegend)
  const extra = Object.entries(variants)
    .filter(([key]) => !skip.has(key) && !key.endsWith('::egen'))
    .map(([key, value]) => {
      if (product.optionGroups?.some((g) => g.key === key)) return null
      return value
    })
    .filter((v): v is string => Boolean(v))
  const optionBits = optionQuoteBits(product, variants)
  const size = selectedTypeOption(product, variants)
  const dim =
    size?.dimensions?.map((d) => `${d.label} ${d.value}`).join(', ') ||
    product.dimensions?.map((d) => `${d.label} ${d.value}`).join(', ')
  const trimmed = ral?.trim() ?? ''
  const ralBit = trimmed
    ? /^ral\b/i.test(trimmed)
      ? trimmed
      : `RAL ${trimmed}`
    : ''
  return [typeName, dim, color, ralBit, ...optionBits, ...extra].filter(Boolean).join(' · ') || undefined
}

export function quoteDraftFromProduct(
  product: Product,
  variants: Record<string, string>,
  opts: {
    qty: number
    ral?: string
    image?: string
    imageAlt?: string
    comment?: string
    imageExample?: boolean
  },
) {
  return {
    slug: product.slug,
    name: product.name,
    sku: quoteLineSku(product, variants),
    variant: quoteLineVariant(product, variants, opts.ral),
    qty: opts.qty,
    href: productPath(product),
    image: opts.image,
    imageAlt: opts.imageAlt,
    comment: opts.comment,
    imageExample: opts.imageExample,
  }
}
