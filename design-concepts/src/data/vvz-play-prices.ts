/** Intern inköpslista. Visas aldrig på den publika katalogen. */

import payload from './generated/vvz-play-prices.json'

export type VvzPlayPriceRow = {
  sku: string
  slug: string
  name: string
  subcategory: string
  subcategorySlug: string
  listEur: number
  discountPercent: number
  netEur: number
}

export const vvzPlayPriceMeta = {
  list: payload.list,
  fetchedAt: payload.fetchedAt,
  currency: payload.currency,
  discountPercent: payload.discountPercent,
  note: payload.note,
  legal: payload.legal,
  address: payload.address,
  website: payload.website,
  vat: payload.vat,
}

export const VVZ_PLAY_DEFAULT_DISCOUNT = payload.discountPercent as number
export const vvzPlayPrices = payload.rows as VvzPlayPriceRow[]
export const vvzPlayPriceCounts = payload.counts

export function netEur(listEur: number, percent: number = VVZ_PLAY_DEFAULT_DISCOUNT) {
  return Math.round(listEur * (1 - percent / 100) * 100) / 100
}

export function formatEur(n: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export function pricesForSlug(slug: string) {
  return vvzPlayPrices.filter((r) => r.slug === slug)
}

export function vvzPlayFamilies() {
  const seen = new Map<string, string>()
  for (const r of vvzPlayPrices) {
    if (!seen.has(r.subcategorySlug)) seen.set(r.subcategorySlug, r.subcategory)
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }))
}
