/** Intern inköpslista. Visas aldrig på den publika katalogen. */

import priceRows from './generated/avfall-prices.json'

export type BinsigniaDiscount = {
  min: number
  max: number | null
  percent: number
  freightPartner: string
  freightList: string
}

export const binsigniaPriceMeta = {
  list: 'Prislista BINSIGNIA september 2026',
  currency: 'EUR',
  vat: 'Exkl. moms. Gäller bolag med giltigt EU-VAT (omvänd skattskyldighet).',
  legal: 'FORWARD SUPPORT SRL',
  vatNr: 'RO34966214',
  regNr: 'J2021003071088',
  address: '9 Prunului Street, Vulcan, Brașov County, 507270, Romania',
  website: 'https://www.binsignia.com',
  mediaSource: 'https://www.binsignia.com/products',
  contact: {
    name: 'Paula Stirbu',
    role: 'B2B / återförsäljning',
    email: 'paula.stirbu@binsignia.com',
    phone: '+40 21 539 99 90',
    mobile: '+40 740 276 637',
  },
  included: [
    'Standarddekaler för avfallsfraktion, valfritt språk och färg',
    'Valfri standard-RAL för pulverlackerad plåt',
    'På rostfritt: RAL för lock eller innerkärl',
  ],
  excluded: [
    'Tull och lokala avgifter utanför EU',
    'Vippbart lock (tillägg enligt listan)',
  ],
  terms: [
    'Tillverkning mot fast order. Inte lagervara.',
    'Endast juridiska personer (B2B).',
    'Icke-exklusiv distribution. Inga landrättigheter.',
    'Drop-ship till slutkund i Sverige/EU. Neutral leverans: ingen BINSIGNIA-faktura eller pris i paketet. Faktura mejlas till STADORA.',
    'Garanti 12 månader från leverans. Ledtid cirka 5 veckor från orderbekräftelse (förskott).',
    'Listpriser i euro. Ingen automatisk omräkning till SEK i konceptet.',
    '122 SKU-rader från prislistan september 2026. Publika sidor visar serie och material, inte EUR.',
    'PETALSTEEL (planteringskärl) finns på leverantörens webb men inte på prislistan — inte importerad.',
  ],
  lidSurchargeEur: {
    PC: { '35 l': 35, '60 l': 40, '100 l': 45 },
    SST: { '35 l': 40, '60 l': 45, '100 l': 50 },
  },
}

export const binsigniaDiscounts: BinsigniaDiscount[] = [
  {
    min: 1,
    max: 19,
    percent: 15,
    freightPartner: 'Beräknas vid orderbekräftelse mot leveransadress och volym.',
    freightList: 'Frakt tillkommer.',
  },
  {
    min: 20,
    max: 50,
    percent: 22,
    freightPartner: 'Fri frakt Sverige och EU enligt mejl från Paula Stirbu (partneravtal).',
    freightList: 'Den tryckta listan undantar frakt, utom EU-order över 50 set.',
  },
  {
    min: 51,
    max: null,
    percent: 30,
    freightPartner: 'Fri frakt Sverige och EU.',
    freightList: 'Fri leverans i EU enligt den tryckta listan (över 50 set).',
  },
]

export type BinsigniaPriceRow = {
  slug: string
  model: string
  material: 'PC' | 'SST'
  sku: string
  config: string
  listEur: number
  variant?: string
  anomaly?: boolean
}

export const binsigniaPrices = priceRows as BinsigniaPriceRow[]

export function discountForQty(qty: number): BinsigniaDiscount {
  if (qty >= 51) return binsigniaDiscounts[2]
  if (qty >= 20) return binsigniaDiscounts[1]
  return binsigniaDiscounts[0]
}

export function netEur(listEur: number, qty: number) {
  const d = discountForQty(qty)
  return Math.round(listEur * (1 - d.percent / 100) * 100) / 100
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
  return binsigniaPrices.filter((r) => r.slug === slug)
}

export function binsigniaModels() {
  const featured = ['LUNA', 'ALBRIS', 'BERNINA', 'EIGER', 'GEMINI']
  const unique = [...new Set(binsigniaPrices.map((r) => r.model))]
  const rest = unique.filter((m) => !featured.includes(m)).sort((a, b) => a.localeCompare(b, 'sv'))
  return [...featured.filter((m) => unique.includes(m)), ...rest]
}
