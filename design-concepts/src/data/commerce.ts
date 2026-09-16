import type { AreaId } from './content'

export type QuoteStatus =
  | 'inkommande'
  | 'komplettera'
  | 'kalkyl'
  | 'intern_granskning'
  | 'skickad'
  | 'forhandling'
  | 'accepterad'
  | 'order'
  | 'fakturering'
  | 'betald'
  | 'forlorad'
  | 'utgangen'

export type InvoiceStatus = 'utkast' | 'skickad' | 'forfallen' | 'betald' | 'krediterad'

export type QuoteLine = {
  name: string
  sku?: string
  qty: number
  unitPrice?: number
  comment?: string
  image?: string
}

export type QuoteEvent = {
  at: string
  actor: string
  text: string
}

export type QuoteCase = {
  id: string
  status: QuoteStatus
  area: AreaId
  project: string
  site: string
  stage: string
  org: string
  orgNr?: string
  contact: string
  email: string
  phone?: string
  owner: string
  receivedAt: string
  validUntil?: string
  sentAt?: string
  lines: QuoteLine[]
  freight?: number
  note?: string
  events: QuoteEvent[]
  lostReason?: string
}

export type Invoice = {
  id: string
  quoteId: string
  status: InvoiceStatus
  issuedAt: string
  dueAt: string
  paidAt?: string
  amount: number
  customer: string
}

export const statusLabel: Record<QuoteStatus, string> = {
  inkommande: 'Inkommen förfrågan',
  komplettera: 'Komplettera',
  kalkyl: 'Kalkyl',
  intern_granskning: 'Intern granskning',
  skickad: 'Offert skickad',
  forhandling: 'Ändringsbegäran',
  accepterad: 'Kund godkänd',
  order: 'Order',
  fakturering: 'Fakturering',
  betald: 'Betald',
  forlorad: 'Förlorad',
  utgangen: 'Utgången',
}

export const invoiceLabel: Record<InvoiceStatus, string> = {
  utkast: 'Utkast',
  skickad: 'Skickad',
  forfallen: 'Förfallen',
  betald: 'Betald',
  krediterad: 'Krediterad',
}

export function formatSek(n: number) {
  return `${n.toLocaleString('sv-SE')} kr`
}

export function lineTotal(line: QuoteLine) {
  if (line.unitPrice == null) return 0
  return line.unitPrice * line.qty
}

export function quoteGoods(q: QuoteCase) {
  return q.lines.reduce((s, l) => s + lineTotal(l), 0)
}

export function quoteTotalExVat(q: QuoteCase) {
  return quoteGoods(q) + (q.freight ?? 0)
}

export function vat(ex: number) {
  return Math.round(ex * 0.25)
}

export const seedQuotes: QuoteCase[] = [
  {
    id: 'Q-2026-0188',
    status: 'inkommande',
    area: 'offentlig',
    project: 'Gårdsförnyelse Södermalm',
    site: 'Högalidsparken, Stockholm',
    stage: 'Systemhandling',
    org: 'Stockholms stad, Trafikkontoret',
    orgNr: '212000-0142',
    contact: 'Eva Lindholm',
    email: 'eva.lindholm@exempel.stockholm.se',
    phone: '08-508 00 00',
    owner: '—',
    receivedAt: '2026-09-16',
    lines: [
      {
        name: 'Parkbänk Årsta',
        sku: 'ST-1208',
        qty: 12,
        comment: 'Ryggstöd, skruvas i marksten',
        image: '/images/arsta-studio.png',
      },
      {
        name: 'Parkbänk Hammarby',
        sku: 'ST-1207',
        qty: 6,
        image: '/images/hammarby-studio.png',
      },
    ],
    events: [
      {
        at: '2026-09-16 09:14',
        actor: 'Webb',
        text: 'Offertförfrågan inkommen. Inget pris visades för kunden.',
      },
    ],
  },
  {
    id: 'Q-2026-0171',
    status: 'kalkyl',
    area: 'offentlig',
    project: 'Avfallsstation innergård',
    site: 'Kungsholmen 12',
    stage: 'Bygghandling',
    org: 'Norrfastigheter AB',
    contact: 'Johan Berg',
    email: 'johan.berg@exempel-norrfast.se',
    owner: 'Mikael S.',
    receivedAt: '2026-09-10',
    lines: [
      {
        name: 'Papperskorg Rödberga 100',
        sku: 'ST-1199',
        qty: 8,
        unitPrice: 12400,
        image: '/images/rodberga-studio.png',
      },
      {
        name: 'Askkopp LUNA',
        qty: 4,
        unitPrice: 4800,
        comment: 'Pulverlackerad stålplåt',
        image: '/images/luna-1.png',
      },
    ],
    freight: 6200,
    events: [
      { at: '2026-09-10 11:02', actor: 'Webb', text: 'Förfrågan inkommen.' },
      { at: '2026-09-11 08:40', actor: 'Mikael S.', text: 'Tilldelad. Påbörjad kalkyl.' },
    ],
  },
  {
    id: 'Q-2026-0164',
    status: 'skickad',
    area: 'offentlig',
    project: 'Parkstråk Sickla',
    site: 'Sickla kaj, Nacka',
    stage: 'Produktion / avrop',
    org: 'Skanska Sverige AB',
    contact: 'Sara Nyström',
    email: 'sara.nystrom@exempel-skanska.se',
    owner: 'Mikael S.',
    receivedAt: '2026-08-28',
    sentAt: '2026-09-04',
    validUntil: '2026-10-04',
    lines: [
      {
        name: 'Parkbänk Årsta',
        sku: 'ST-1208',
        qty: 18,
        unitPrice: 18900,
        image: '/images/arsta-studio.png',
      },
      {
        name: 'Parkbänk Gröndal',
        sku: 'ST-1210',
        qty: 8,
        unitPrice: 16400,
        image: '/images/grondal-studio.png',
      },
    ],
    freight: 18400,
    events: [
      { at: '2026-08-28 14:11', actor: 'Webb', text: 'Förfrågan inkommen.' },
      { at: '2026-09-02 16:20', actor: 'Mikael S.', text: 'Kalkyl klar. Intern granskning hoppades över (< 500 tkr).' },
      { at: '2026-09-04 09:05', actor: 'Mikael S.', text: 'Offert mejlades till kunden med godkännandelänk.' },
    ],
  },
  {
    id: 'Q-2026-0158',
    status: 'komplettera',
    area: 'offentlig',
    project: 'Utegym skolgård',
    site: 'Järva',
    stage: 'Program',
    org: 'SISAB',
    contact: 'Lina Holm',
    email: 'lina.holm@exempel-sisab.se',
    owner: 'Anna P.',
    receivedAt: '2026-09-08',
    lines: [
      { name: 'Utegym — sortiment utkast', qty: 1, comment: 'Kunden vill ha utegym, ingen verifierad SKU vald' },
    ],
    events: [
      { at: '2026-09-08 10:00', actor: 'Webb', text: 'Förfrågan inkommen utan specificerade artiklar.' },
      {
        at: '2026-09-09 09:30',
        actor: 'Anna P.',
        text: 'Efterfrågade plan, fallskyddszon och åldersgrupp. Inväntar handling.',
      },
    ],
  },
  {
    id: 'Q-2026-0152',
    status: 'accepterad',
    area: 'offentlig',
    project: 'Bostadsgård Finnboda',
    site: 'Finnboda, Nacka',
    stage: 'Produktion / avrop',
    org: 'Nacka kommun',
    contact: 'Per Ahlgren',
    email: 'per.ahlgren@exempel.nacka.se',
    owner: 'Mikael S.',
    receivedAt: '2026-08-12',
    sentAt: '2026-08-19',
    validUntil: '2026-09-19',
    lines: [
      {
        name: 'Parkbänk Aspudden',
        sku: 'ST-1211',
        qty: 10,
        unitPrice: 21400,
        image: '/images/aspudden-studio.png',
      },
    ],
    freight: 9800,
    events: [
      { at: '2026-08-19 11:00', actor: 'Mikael S.', text: 'Offert skickad.' },
      { at: '2026-09-01 13:44', actor: 'Kund', text: 'Godkände offerten via länken. Inte en webbetalning.' },
    ],
  },
  {
    id: 'Q-2026-0140',
    status: 'fakturering',
    area: 'offentlig',
    project: 'Gårdsmöbler BRF',
    site: 'Hammarby sjöstad',
    stage: 'Förvaltning / komplettering',
    org: 'BRF Sjöstaden 4',
    contact: 'Karin Ek',
    email: 'styrelse@exempel-brf.se',
    owner: 'Anna P.',
    receivedAt: '2026-07-02',
    sentAt: '2026-07-08',
    lines: [
      {
        name: 'Parkbänk Hammarby',
        sku: 'ST-1207',
        qty: 4,
        unitPrice: 17200,
        image: '/images/hammarby-studio.png',
      },
      {
        name: 'Papperskorg Rödberga 100',
        sku: 'ST-1199',
        qty: 2,
        unitPrice: 12400,
        image: '/images/rodberga-studio.png',
      },
    ],
    freight: 4200,
    events: [
      { at: '2026-07-14', actor: 'Kund', text: 'Offert godkänd.' },
      { at: '2026-08-20', actor: 'Anna P.', text: 'Levererad. Faktura F-2026-204 skapad.' },
    ],
  },
  {
    id: 'Q-2026-0128',
    status: 'betald',
    area: 'vard',
    project: 'Akutvagnar avdelning 4',
    site: 'Södersjukhuset',
    stage: 'Avrop',
    org: 'Region Stockholm',
    contact: 'Magnus Ivarsson',
    email: 'magnus.ivarsson@exempel.sll.se',
    owner: 'Helena K.',
    receivedAt: '2026-05-20',
    sentAt: '2026-05-27',
    lines: [
      { name: 'Akutvagn Genius', qty: 3, unitPrice: 42800, image: '/images/genius.png' },
    ],
    freight: 2400,
    events: [
      { at: '2026-06-02', actor: 'Kund', text: 'Godkänd.' },
      { at: '2026-06-18', actor: 'Helena K.', text: 'Faktura F-2026-198 betald.' },
    ],
  },
  {
    id: 'Q-2026-0119',
    status: 'forlorad',
    area: 'skola',
    project: 'Förskoleförvaring',
    site: 'Hägersten',
    stage: 'Upphandling',
    org: 'Stockholms stad, Utbildningsförvaltningen',
    contact: 'Nora Ali',
    email: 'nora.ali@exempel.stockholm.se',
    owner: 'Anna P.',
    receivedAt: '2026-04-03',
    sentAt: '2026-04-11',
    lines: [{ name: 'Ada – melaminskåp', qty: 14, unitPrice: 6200, image: '/images/ada.png' }],
    freight: 3800,
    lostReason: 'Annan leverantör i avropet.',
    events: [
      { at: '2026-04-11', actor: 'Anna P.', text: 'Offert skickad.' },
      { at: '2026-05-02', actor: 'Anna P.', text: 'Förlorad. Annan leverantör.' },
    ],
  },
]

export const seedInvoices: Invoice[] = [
  {
    id: 'F-2026-204',
    quoteId: 'Q-2026-0140',
    status: 'skickad',
    issuedAt: '2026-08-20',
    dueAt: '2026-09-19',
    amount: 97800,
    customer: 'BRF Sjöstaden 4',
  },
  {
    id: 'F-2026-198',
    quoteId: 'Q-2026-0128',
    status: 'betald',
    issuedAt: '2026-06-04',
    dueAt: '2026-07-04',
    paidAt: '2026-06-18',
    amount: 130800,
    customer: 'Region Stockholm',
  },
  {
    id: 'F-2026-191',
    quoteId: 'Q-2026-0090',
    status: 'betald',
    issuedAt: '2026-03-12',
    dueAt: '2026-04-11',
    paidAt: '2026-04-02',
    amount: 214600,
    customer: 'Svenska Bostäder',
  },
]

export type Kpis = {
  pipeline: number
  ordersYtd: number
  invoicedYtd: number
  collectedYtd: number
  receivables: number
  overdue: number
  winRate: number
  openQuotes: number
  avgDaysToSend: number
}

export function computeKpis(quotes: QuoteCase[], invoices: Invoice[]): Kpis {
  const priced: QuoteStatus[] = ['skickad', 'forhandling', 'intern_granskning', 'kalkyl']
  const won: QuoteStatus[] = ['accepterad', 'order', 'fakturering', 'betald']
  const pipeline = quotes.filter((q) => priced.includes(q.status)).reduce((s, q) => s + quoteTotalExVat(q), 0)
  const ordersYtd = quotes.filter((q) => won.includes(q.status)).reduce((s, q) => s + quoteTotalExVat(q), 0)
  const invoicedYtd = invoices.filter((i) => i.status !== 'krediterad' && i.status !== 'utkast').reduce((s, i) => s + i.amount, 0)
  const collectedYtd = invoices.filter((i) => i.status === 'betald').reduce((s, i) => s + i.amount, 0)
  const receivables = invoices.filter((i) => i.status === 'skickad' || i.status === 'forfallen').reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter((i) => i.status === 'forfallen').reduce((s, i) => s + i.amount, 0)
  const decided = quotes.filter((q) => won.includes(q.status) || q.status === 'forlorad')
  const wins = quotes.filter((q) => won.includes(q.status))
  const winRate = decided.length ? Math.round((wins.length / decided.length) * 100) : 0
  const openQuotes = quotes.filter((q) => !['betald', 'forlorad', 'utgangen'].includes(q.status)).length
  return {
    pipeline,
    ordersYtd,
    invoicedYtd,
    collectedYtd,
    receivables,
    overdue,
    winRate,
    openQuotes,
    avgDaysToSend: 6,
  }
}

export const nextActions: Partial<Record<QuoteStatus, { label: string; to: QuoteStatus }[]>> = {
  inkommande: [
    { label: 'Ta in i kalkyl', to: 'kalkyl' },
    { label: 'Be om komplettering', to: 'komplettera' },
    { label: 'Markera förlorad', to: 'forlorad' },
  ],
  komplettera: [
    { label: 'Handling inne — kalkyl', to: 'kalkyl' },
    { label: 'Markera förlorad', to: 'forlorad' },
  ],
  kalkyl: [
    { label: 'Skicka offert till kund', to: 'skickad' },
    { label: 'Intern granskning', to: 'intern_granskning' },
  ],
  intern_granskning: [
    { label: 'Godkänn och skicka', to: 'skickad' },
    { label: 'Tillbaka till kalkyl', to: 'kalkyl' },
  ],
  skickad: [
    { label: 'Kunden godkände (simulera)', to: 'accepterad' },
    { label: 'Ändringsbegäran', to: 'forhandling' },
    { label: 'Markera förlorad', to: 'forlorad' },
  ],
  forhandling: [
    { label: 'Ny kalkyl', to: 'kalkyl' },
    { label: 'Skicka reviderad offert', to: 'skickad' },
  ],
  accepterad: [{ label: 'Skapa orderbekräftelse', to: 'order' }],
  order: [{ label: 'Skapa faktura', to: 'fakturering' }],
  fakturering: [{ label: 'Markera betald', to: 'betald' }],
}
