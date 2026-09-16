export type SupplierStatus = 'aktiv' | 'invantar_underlag' | 'pausad'

export type SupplierContact = {
  name: string
  role: string
  email: string
  phone: string
}

export type Supplier = {
  id: string
  name: string
  status: SupplierStatus
  orgNr: string
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
    id: 'luna-pending',
    name: 'LUNA-askkopp — leverantör saknas',
    status: 'invantar_underlag',
    orgNr: '',
    website: '',
    mediaSource: '',
    contact: emptyContact(),
    address: '',
    notes:
      'Askkopp LUNA ligger i den offentliga katalogen. Fyll i leverantörens namn, kontaktperson och länk till produktbilder/katalog. Vi hämtar inte bilder från stadora.se.',
    productSlugs: ['askkopp-luna'],
  },
]

export function newSupplierId() {
  return `lev-${crypto.randomUUID().slice(0, 8)}`
}
