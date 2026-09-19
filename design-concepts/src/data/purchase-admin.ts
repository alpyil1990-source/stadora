/** Admin-only purchase summaries. Never used on public catalog pages. */

import {
  formatEur as formatBinsignia,
  netEur as binsigniaNet,
  pricesForSlug as binsigniaForSlug,
} from './binsignia-prices'
import { formatEur as formatInvestim, pricesForSlug as investimForSlug } from './investim-prices'
import {
  formatEur as formatStreetpark,
  netEur as streetparkNet,
  pricesForSlug as streetparkForSlug,
  STREETPARK_DEFAULT_DISCOUNT,
} from './streetpark-prices'
import {
  formatEur as formatVvz,
  netEur as vvzNet,
  pricesForSlug as vvzForSlug,
  VVZ_PLAY_DEFAULT_DISCOUNT,
} from './vvz-play-prices'

export type PurchaseHint = {
  label: string
  href: string
  missing: boolean
}

const PRICE_SUPPLIERS = new Set(['binsignia', 'investim', 'streetpark', 'vvz-play'])

export function supplierHasPurchaseList(id: string) {
  return PRICE_SUPPLIERS.has(id)
}

function rangeLabel(values: number[], format: (n: number) => string) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? format(min) : `${format(min)}–${format(max)}`
}

export function purchaseHint(supplierId: string, slug: string): PurchaseHint | null {
  if (supplierId === 'binsignia') {
    const rows = binsigniaForSlug(slug)
    const href = rows[0]
      ? `/admin/leverantorer/binsignia?serie=${encodeURIComponent(rows[0].model)}#inkopspris`
      : '/admin/leverantorer/binsignia#inkopspris'
    if (!rows.length) {
      return { label: 'Saknas i inköpslistan', href, missing: true }
    }
    const lists = rows.map((r) => r.listEur)
    const nets = lists.map((n) => binsigniaNet(n, 1))
    return {
      label: `Listpris ${rangeLabel(lists, formatBinsignia)} · inköp 15 % ${rangeLabel(nets, formatBinsignia)}`,
      href,
      missing: false,
    }
  }

  if (supplierId === 'investim') {
    const rows = investimForSlug(slug)
    const href = `/admin/leverantorer/investim?produkt=${encodeURIComponent(slug)}#inkopspris`
    if (!rows.length) {
      return { label: 'Saknas i inköpslistan', href, missing: true }
    }
    const lists = rows.map((r) => r.listEur).filter((n): n is number => n != null)
    const nets = rows.map((r) => r.netEur).filter((n): n is number => n != null)
    if (!lists.length) {
      return { label: 'Listpris saknas på raden', href, missing: true }
    }
    const pct = rows[0]?.discountPercent
    const netPart =
      nets.length > 0
        ? ` · inköp${pct != null ? ` ${pct} %` : ''} ${rangeLabel(nets, formatInvestim)}`
        : ''
    return {
      label: `Listpris ${rangeLabel(lists, formatInvestim)}${netPart}`,
      href,
      missing: false,
    }
  }

  if (supplierId === 'streetpark') {
    const rows = streetparkForSlug(slug)
    const href = `/admin/leverantorer/streetpark?produkt=${encodeURIComponent(slug)}#inkopspris`
    if (!rows.length) {
      return { label: 'Saknas på STREETPARK-prislistan 2026/01', href, missing: true }
    }
    const lists = rows.map((r) => r.listEur)
    const nets = lists.map((n) => streetparkNet(n, STREETPARK_DEFAULT_DISCOUNT))
    return {
      label: `Listpris ${rangeLabel(lists, formatStreetpark)} · inköp ${STREETPARK_DEFAULT_DISCOUNT} % ${rangeLabel(nets, formatStreetpark)}`,
      href,
      missing: false,
    }
  }

  if (supplierId === 'vvz-play') {
    const rows = vvzForSlug(slug)
    const href = `/admin/leverantorer/vvz-play?produkt=${encodeURIComponent(slug)}#inkopspris`
    if (!rows.length) {
      return { label: 'Saknas på VVZ-Play-prislistan 2026', href, missing: true }
    }
    const lists = rows.map((r) => r.listEur)
    const nets = lists.map((n) => vvzNet(n, VVZ_PLAY_DEFAULT_DISCOUNT))
    return {
      label: `Listpris ${rangeLabel(lists, formatVvz)} · inköp ${VVZ_PLAY_DEFAULT_DISCOUNT} % ${rangeLabel(nets, formatVvz)}`,
      href,
      missing: false,
    }
  }

  return null
}
