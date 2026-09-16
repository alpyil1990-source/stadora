/** Intern inköpslista. Visas aldrig på den publika katalogen. */

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
    'Utkastet visar fem modeller. Hela listan har 122 rader; de importeras inte förrän utkastet är godkänt.',
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
}

export const binsigniaDraftPrices: BinsigniaPriceRow[] = [
  { slug: 'askkopp-luna', model: 'LUNA', material: 'PC', sku: '9747', config: '1 × 35 l', listEur: 490 },
  { slug: 'askkopp-luna', model: 'LUNA', material: 'SST', sku: '9698', config: '1 × 35 l', listEur: 690 },

  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '1 × 35 l', listEur: 490 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '1 × 60 l', listEur: 610 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '1 × 100 l', listEur: 720 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '2 × 35 l', listEur: 790 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '2 × 60 l', listEur: 1020 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '2 × 100 l', listEur: 1150 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '3 × 35 l', listEur: 1120 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '3 × 60 l', listEur: 1360 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '3 × 100 l', listEur: 1620 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '4 × 35 l', listEur: 1340 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '4 × 60 l', listEur: 1620 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'PC', sku: '1088', config: '4 × 100 l', listEur: 2150 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '1 × 35 l', listEur: 600 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '1 × 60 l', listEur: 650 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '1 × 100 l', listEur: 870 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '2 × 35 l', listEur: 1030 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '2 × 60 l', listEur: 1120 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '2 × 100 l', listEur: 1260 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '3 × 35 l', listEur: 1250 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '3 × 60 l', listEur: 1630 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '3 × 100 l', listEur: 1770 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '4 × 35 l', listEur: 1500 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '4 × 60 l', listEur: 1880 },
  { slug: 'kallsortering-albris', model: 'ALBRIS', material: 'SST', sku: '1096', config: '4 × 100 l', listEur: 2300 },

  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '1 × 35 l', listEur: 370 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '1 × 60 l', listEur: 470 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '1 × 100 l', listEur: 570 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '2 × 35 l', listEur: 510 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '2 × 60 l', listEur: 620 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '2 × 100 l', listEur: 710 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '3 × 35 l', listEur: 730 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '3 × 60 l', listEur: 860 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '3 × 100 l', listEur: 1040 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '4 × 35 l', listEur: 850 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '4 × 60 l', listEur: 1040 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'PC', sku: '1107', config: '4 × 100 l', listEur: 1150 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '1 × 35 l', listEur: 490 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '1 × 60 l', listEur: 620 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '1 × 100 l', listEur: 730 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '2 × 35 l', listEur: 840 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '2 × 60 l', listEur: 950 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '2 × 100 l', listEur: 1000 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '3 × 35 l', listEur: 990 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '3 × 60 l', listEur: 1130 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '3 × 100 l', listEur: 1400 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '4 × 35 l', listEur: 1250 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '4 × 60 l', listEur: 1420 },
  { slug: 'kallsortering-bernina', model: 'BERNINA', material: 'SST', sku: '1114', config: '4 × 100 l', listEur: 1680 },

  { slug: 'kallsortering-eiger', model: 'EIGER', material: 'PC', sku: '14300', config: '3 × 100 l', listEur: 2310 },
  { slug: 'kallsortering-eiger', model: 'EIGER', material: 'SST', sku: '14333', config: '3 × 100 l', listEur: 2620 },

  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '1 × 35 l', listEur: 720 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '1 × 60 l', listEur: 890 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '1 × 100 l', listEur: 920 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '2 × 35 l', listEur: 970 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '2 × 60 l', listEur: 1070 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '2 × 100 l', listEur: 1150 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '3 × 35 l', listEur: 1050 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '3 × 60 l', listEur: 1110 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '3 × 100 l', listEur: 1260 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '4 × 35 l', listEur: 1150 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '4 × 60 l', listEur: 1320 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'PC', sku: '8661', config: '4 × 100 l', listEur: 1470 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '1 × 35 l', listEur: 890 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '1 × 60 l', listEur: 940 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '1 × 100 l', listEur: 1030 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '2 × 35 l', listEur: 1040 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '2 × 60 l', listEur: 1120 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '2 × 100 l', listEur: 1240 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '3 × 35 l', listEur: 1170 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '3 × 60 l', listEur: 1270 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '3 × 100 l', listEur: 1420 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '4 × 35 l', listEur: 1260 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '4 × 60 l', listEur: 1400 },
  { slug: 'kallsortering-gemini', model: 'GEMINI', material: 'SST', sku: '8532', config: '4 × 100 l', listEur: 1585 },
]

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
  return binsigniaDraftPrices.filter((r) => r.slug === slug)
}
