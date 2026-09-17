/** Intern inköpslista. Visas aldrig på den publika katalogen. */

import payload from './generated/streetpark-prices.json'

export type StreetparkDiscount = {
  minEur: number
  maxEur: number | null
  percent: number
  label: string
}

export type StreetparkPriceRow = {
  sku: string
  catalogSku: string | null
  slug: string | null
  model: string | null
  name: string
  config: string
  listEur: number
  family: string
  familyLabel: string
  seriesName: string | null
  gap: string | null
}

export type StreetparkGap = {
  sku: string
  slug: string | null
  seriesName: string | null
  config: string
  listEur: number
  reason: string
}

export const streetparkPriceMeta = {
  list: payload.list,
  fetchedAt: payload.fetchedAt,
  currency: payload.currency,
  note: payload.note,
  legal: 'STREETPARK s.r.o.',
  address: 'Ptáčov 40, 674 01 Třebíč, Tjeckien',
  website: 'https://www.streetpark.eu',
  vat: 'EUR exkl. moms. Beloppen i PDF:erna är recommended customer prices, inte kundpris på stadora.se.',
  terms: payload.terms,
}

export const streetparkDiscounts = payload.discounts as StreetparkDiscount[]
export const streetparkPrices = payload.rows as StreetparkPriceRow[]
export const streetparkGaps = payload.gaps as StreetparkGap[]
export const streetparkCatalogWithoutPrice = payload.catalogWithoutPrice as {
  slug: string
  name: string
  model: string
}[]
export const streetparkCatalogSizesWithoutPrice = payload.catalogSizesWithoutPrice as {
  slug: string
  name: string
  sku: string
}[]
export const streetparkPriceCounts = payload.counts

/** Default partner level in the cooperation PDF: yearly turnover under 100 000 EUR. */
export const STREETPARK_DEFAULT_DISCOUNT = 20

export function netEur(listEur: number, percent: number) {
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
  return streetparkPrices.filter((r) => r.slug === slug)
}

export function streetparkFamilies() {
  const seen = new Map<string, string>()
  for (const r of streetparkPrices) {
    if (!seen.has(r.family)) seen.set(r.family, r.familyLabel)
  }
  return [...seen.entries()].map(([id, label]) => ({ id, label }))
}

export function streetparkProductOptions() {
  const map = new Map<string, { slug: string; name: string; model: string; family: string }>()
  for (const r of streetparkPrices) {
    if (r.slug && !map.has(r.slug)) {
      map.set(r.slug, {
        slug: r.slug,
        name: r.name,
        model: r.model ?? r.name,
        family: r.family,
      })
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'sv'))
}
