import type { ConfigGroup, Product, ProductImage } from './content'
import { COLOR_VARIANT_KEY, SIZE_VARIANT_KEY } from './configure'

export function visibleGroups(product: Product, state: Record<string, string>): ConfigGroup[] {
  const groups = product.optionGroups ?? []
  return groups.filter((g) => {
    if (!g.parentKey) return true
    return state[g.parentKey] === g.parentValue
  })
}

export function initialOptionState(product: Product): Record<string, string> {
  const state: Record<string, string> = {}
  const groups = product.optionGroups ?? []
  for (const g of groups) {
    if (g.parentKey) continue
    const first = g.options.find((o) => !o.customText) ?? g.options[0]
    if (first) state[g.key] = first.name
  }
  let changed = true
  while (changed) {
    changed = false
    for (const g of visibleGroups(product, state)) {
      if (state[g.key]) continue
      const first = g.options.find((o) => !o.customText) ?? g.options[0]
      if (first) {
        state[g.key] = first.name
        changed = true
      }
    }
  }
  return state
}

export function applyOptionChange(
  product: Product,
  state: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  const next: Record<string, string> = { ...state, [key]: value }
  const groups = product.optionGroups ?? []
  for (const g of groups) {
    if (!g.parentKey) continue
    const parentNow = next[g.parentKey]
    if (parentNow !== g.parentValue) {
      delete next[g.key]
      delete next[`${g.key}::egen`]
      continue
    }
    const stillValid = g.options.some((o) => o.name === next[g.key])
    if (!stillValid) {
      const first = g.options.find((o) => !o.customText) ?? g.options[0]
      if (first) next[g.key] = first.name
      else delete next[g.key]
    }
  }
  return next
}

export function optionComplete(product: Product, state: Record<string, string>): boolean {
  const visible = visibleGroups(product, state)
  if (visible.length === 0) return true
  return visible.every((g) => {
    const value = state[g.key]
    if (!value) return false
    const opt = g.options.find((o) => o.name === value)
    if (opt?.customText) return Boolean(state[`${g.key}::egen`]?.trim())
    return true
  })
}

export function optionQuoteBits(product: Product, state: Record<string, string>): string[] {
  const bits: string[] = []
  for (const g of visibleGroups(product, state)) {
    const value = state[g.key]
    if (!value) continue
    const opt = g.options.find((o) => o.name === value)
    const extra = opt?.customText ? state[`${g.key}::egen`]?.trim() : ''
    bits.push(extra ? `${g.label}: ${value} (${extra})` : `${g.label}: ${value}`)
  }
  return bits
}

export function matchingImages(product: Product, state: Record<string, string>): {
  shown: ProductImage[]
  matched: boolean
} {
  const tagged = product.images.filter((img) => img.color || Object.keys(img).length)
  const finish = state['Stomfinish'] || state[COLOR_VARIANT_KEY]
  const wood = state['Träslag']
  const hits = product.images.filter((img) => {
    if (img.color && finish && img.color !== finish) return false
    return true
  })
  if (hits.length && finish && hits.some((i) => i.color === finish)) {
    return { shown: hits, matched: true }
  }
  if (wood) {
    const byWood = product.images.filter((i) => i.alt.toLowerCase().includes(wood.toLowerCase()))
    if (byWood.length) return { shown: byWood, matched: true }
  }
  return { shown: product.images, matched: tagged.length === 0 || !finish }
}

export { COLOR_VARIANT_KEY, SIZE_VARIANT_KEY }
