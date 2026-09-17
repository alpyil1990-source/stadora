/** Intern inköpslista. Visas aldrig på den publika katalogen. */

import priceRows from './generated/investim-prices.json'

export const investimPriceMeta = {
  list: 'Prislista INVESTIM 2026 EUR',
  currency: 'EUR',
  vat: 'Exkl. moms.',
  legal: 'INVESTIM S.A.',
  vatNr: 'PL5260152790',
  nip: '5260152790',
  krs: '0000124986',
  website: 'https://www.investim.com.pl',
  mediaSource: 'https://investim.com.pl/oferta',
  addressOffice: 'ul. Cybernetyki 4a lok. U4, 02-677 Warszawa, Polen',
  addressPlant: 'ul. Suwalna 5a, 05-119 Łajski, Polen',
  contact: {
    name: 'Robert Miąsek',
    role: 'COO',
    email: 'robert@investim.com.pl',
    phone: '+48 578 220 440',
  },
  extras: [
    'Monteringssats för bänk i mark: 55 EUR per set enligt listan.',
    'Reflextejp för pollare 150, 151 och 155: 15 EUR (5 cm) eller 30 EUR (10 cm).',
    'Målning av betong: 15–62 EUR beroende på storlek och kulör.',
    'Ballastkulörer White Marianna, Mix Kruszyw och Grys Biało Czarny: +20 % på listpris.',
  ],
  skipped: [
    'Pollare målad med fluorescerande färg — undantagen enligt underlaget.',
  ],
}

export const investimDiscountRules = [
  {
    family: 'ac',
    label: 'Arkitektonisk betong',
    percent: 10,
    note: 'Hela sortimentet: bänkar, pollare och övrigt i arkitektonisk betong.',
  },
  {
    family: 'rinsed',
    label: 'Tvättad betong',
    percent: 20,
    note: 'All tvättad betong. Bänkar i tvättad betong har 10 % i stället.',
  },
  {
    family: 'bench',
    label: 'Bänkar',
    percent: 10,
    note: 'Alla bänkar: tvättad betong, arkitektonisk betong och stål.',
  },
  {
    family: 'bin_wood_steel',
    label: 'Papperskorg i tvättad granit med trä och stållock',
    percent: 5,
    note: 'Undantag från 20 % på tvättad betong. Ingen sådan produkt i den här importen.',
  },
]

export type InvestimPriceRow = {
  slug: string
  name: string
  sku: string
  variant: string
  listEur: number | null
  discountPercent: number | null
  netEur: number | null
  discountRule: string
  note: string | null
  family: string
}

export const investimPrices = priceRows as InvestimPriceRow[]

export function pricesForSlug(slug: string) {
  return investimPrices.filter((r) => r.slug === slug)
}

export function formatEur(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

const FAMILY_LABEL: Record<string, string> = {
  ac: 'Arkitektonisk betong',
  rinsed: 'Tvättad betong (pollare m.m.)',
  rinsed_bench: 'Bänkar, tvättad betong',
  steel: 'Bänkar i stål',
}

export function investimGroups() {
  const order = ['rinsed_bench', 'steel', 'ac', 'rinsed']
  const unique = [...new Set(investimPrices.map((r) => r.family))]
  return [...order.filter((f) => unique.includes(f)), ...unique.filter((f) => !order.includes(f))]
}

export function familyLabel(family: string) {
  return FAMILY_LABEL[family] ?? investimDiscountRules.find((r) => r.family === family)?.label ?? family
}
