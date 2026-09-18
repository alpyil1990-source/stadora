import type { ConfigGroup, Product, ProductImage } from './content'
import { COLOR_VARIANT_KEY, SIZE_VARIANT_KEY } from './configure'
import { isKuschFoldProduct } from './kusch-vcare-fold'

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

function kuschFoldImages(product: Product, state: Record<string, string>): {
  shown: ProductImage[]
  matched: boolean
  unmatchedLabel?: string
} {
  const sizeName = state[SIZE_VARIANT_KEY]
  const utforande = state['Utförande']
  const frame = state['Stomkulör']
  const exact = product.images.filter((img) => {
    if (sizeName && img.size !== sizeName) return false
    if (utforande && img.utforande && img.utforande !== utforande) return false
    return Boolean(img.size)
  })
  const label = [sizeName, utforande ? utforande.toLowerCase() : undefined].filter(Boolean).join(', ')
  if (!exact.length) {
    return {
      shown: product.images,
      matched: false,
      unmatchedLabel: label || undefined,
    }
  }
  const byFrame = frame ? exact.filter((img) => img.color === frame) : []
  const primary = byFrame.length ? byFrame : exact
  const rest = product.images.filter((img) => !primary.includes(img))
  return { shown: [...primary, ...rest], matched: true }
}

export function matchingImages(
  product: Product,
  state: Record<string, string>,
): {
  shown: ProductImage[]
  matched: boolean
  unmatchedLabel?: string
} {
  if (isKuschFoldProduct(product)) {
    return kuschFoldImages(product, state)
  }
  const finish = state['Stomfinish'] || state['Konstruktion'] || state[COLOR_VARIANT_KEY]
  const wood = state['Träslag'] || state['Sits'] || state['Bordsskiva']
  const hits = product.images.filter((img) => img.color && finish && img.color === finish)
  if (hits.length) {
    const rest = product.images.filter((img) => img.color !== finish)
    return { shown: [...hits, ...rest], matched: true }
  }
  if (finish) {
    const carbon = /kolstål/i.test(finish)
    const stainless = /rostfritt/i.test(finish)
    const byAlt = product.images.filter((img) => {
      const alt = img.alt.toLowerCase()
      if (carbon && /\bcarbon\b/.test(alt)) return true
      if (stainless && /\bstainless\b|\brostfritt\b/.test(alt)) return true
      return false
    })
    if (byAlt.length) {
      const rest = product.images.filter((img) => !byAlt.includes(img))
      return { shown: [...byAlt, ...rest], matched: true }
    }
  }
  if (wood) {
    const byWood = product.images.filter((i) => i.alt.toLowerCase().includes(wood.toLowerCase()))
    if (byWood.length) return { shown: byWood, matched: true }
  }
  const tagged = product.images.filter((img) => img.color)
  if (product.manufacturer === 'ZANO' && (finish || wood)) {
    return { shown: product.images, matched: false }
  }
  return { shown: product.images, matched: tagged.length === 0 || !finish }
}

export function weightForSelection(
  product: Product,
  variants?: Record<string, string>,
): { beside?: string; full?: string; missingFor?: string } {
  const full = product.weight
  const by = product.weightByOption
  const wood = variants?.['Sits'] || variants?.['Bordsskiva']
  if (by && wood) {
    if (by[wood]) return { beside: by[wood], full, missingFor: undefined }
    return { beside: undefined, full, missingFor: wood }
  }
  if (by && Object.keys(by).length > 1) {
    return { beside: undefined, full }
  }
  if (by && Object.keys(by).length === 1) {
    return { beside: Object.values(by)[0], full }
  }
  return { beside: product.weightSummary ?? full, full }
}

export { COLOR_VARIANT_KEY, SIZE_VARIANT_KEY }
