export type SupplierStatus = 'aktiv' | 'invantar_underlag' | 'pausad'

export type SupplierContact = {
  name: string
  role: string
  email: string
  phone: string
  mobile?: string
}

export type Supplier = {
  id: string
  name: string
  status: SupplierStatus
  orgNr: string
  vatNr?: string
  legalName?: string
  website: string
  /** Direct media/catalog URL from the supplier — not stadora.se. */
  mediaSource: string
  contact: SupplierContact
  address: string
  notes: string
  productSlugs: string[]
}

export const supplierStatusLabel: Record<SupplierStatus, string> = {
  aktiv: 'Aktiv',
  invantar_underlag: 'Inväntar underlag',
  pausad: 'Pausad',
}

export const emptyContact = (): SupplierContact => ({
  name: '',
  role: '',
  email: '',
  phone: '',
})

export const seedSuppliers: Supplier[] = [
  {
    id: 'relicon',
    name: 'Relicon AB (STADORA)',
    status: 'aktiv',
    orgNr: '559174-4551',
    website: 'https://stadora.se',
    mediaSource: '',
    contact: {
      name: '',
      role: '',
      email: 'info@stadora.se',
      phone: '',
    },
    address: 'Plantslingan 36, 142 51 Skogås',
    notes:
      'Egna utemiljöprodukter i konceptet (parkbänkar, Rödberga). Namngiven inköpskontakt saknas i underlaget. Nya foton ska komma från intern/leverantörslänk — inte skrapas från den publicerade sajten.',
    productSlugs: [
      'parkbank-arsta',
      'parkbank-hammarby',
      'parkbank-grondal',
      'parkbank-aspudden',
      'parkbank-enskede',
      'papperskorg-rodberga-100',
    ],
  },
  {
    id: 'binsignia',
    name: 'BINSIGNIA® / FORWARD SUPPORT SRL',
    status: 'aktiv',
    orgNr: 'J2021003071088',
    vatNr: 'RO34966214',
    legalName: 'FORWARD SUPPORT SRL',
    website: 'https://www.binsignia.com',
    mediaSource: 'https://www.binsignia.com/products',
    contact: {
      name: 'Paula Stirbu',
      role: 'B2B / återförsäljning',
      email: 'paula.stirbu@binsignia.com',
      phone: '+40 21 539 99 90',
      mobile: '+40 740 276 637',
    },
    address: '9 Prunului Street, Vulcan, Brașov County, 507270, Romania',
    notes:
      'Partneravtal september 2026. Bildrätt: produktfoton, beskrivningar och övergripande spec på stadora.se. Ritningar/PDF per projekt. Drop-ship Sverige, neutral leverans. Icke-exklusivt. B2B, omvänd skattskyldighet. Listpris EUR, rabatt 15/22/30 %. Utkast: 5 av 107 modeller på webbplatsen. Hämta inte bilder från stadora.se.',
    productSlugs: [
      'askkopp-luna',
      'kallsortering-albris',
      'kallsortering-bernina',
      'kallsortering-eiger',
      'kallsortering-gemini',
    ],
  },
]

export function newSupplierId() {
  return `lev-${crypto.randomUUID().slice(0, 8)}`
}
