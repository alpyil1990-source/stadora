import { BINSIGNIA_SLUGS } from './binsignia'
import { INVESTIM_SLUGS } from './investim'
import { STREETPARK_SLUGS } from './streetpark'

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

/** Relicon AB is STADORA — own-brand catalog products are not a supplier. */
export const seedSuppliers: Supplier[] = [
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
      'Partneravtal september 2026. Bildrätt: produktfoton, beskrivningar och övergripande spec på stadora.se. Ritningar/PDF per projekt. Drop-ship Sverige, neutral leverans. Icke-exklusivt. B2B, omvänd skattskyldighet. Listpris EUR, rabatt 15/22/30 %. 54 serier i katalogen, 122 SKU-rader i intern lista. PETALSTEEL saknas på prislistan och är inte importerad. Hämta inte bilder från stadora.se. Leverantörens artikelnummer syns bara i admin.',
    productSlugs: [...BINSIGNIA_SLUGS],
  },
  {
    id: 'investim',
    name: 'INVESTIM S.A.',
    status: 'aktiv',
    orgNr: '0000124986',
    vatNr: 'PL5260152790',
    legalName: 'INVESTIM S.A.',
    website: 'https://www.investim.com.pl',
    mediaSource: 'https://investim.com.pl/oferta',
    contact: {
      name: 'Robert Miąsek',
      role: 'COO',
      email: 'robert@investim.com.pl',
      phone: '+48 578 220 440',
    },
    address:
      'Kontor: ul. Cybernetyki 4a lok. U4, 02-677 Warszawa. Produktion: ul. Suwalna 5a, 05-119 Łajski, Polen.',
    notes:
      'Prislista 2026 EUR. Rabatt: all arkitektonisk betong 10 %; all tvättad betong 20 %, bänkar 10 %; papperskorg i tvättad granit med trä och stållock 5 %. Stålbänkar räknas som bänkar (10 %). Parkbänkar, pollare, cykelställ och planteringskärl från skickade länkar; fluorescerande pollare undantagen. Katalognummer och EUR bara i admin. Hämta inte bilder från stadora.se.',
    productSlugs: [...INVESTIM_SLUGS],
  },
  {
    id: 'streetpark',
    name: 'STREETPARK s.r.o.',
    status: 'aktiv',
    orgNr: '',
    legalName: 'STREETPARK s.r.o.',
    website: 'https://www.streetpark.eu',
    mediaSource: 'https://www.streetpark.eu/en/products/',
    contact: {
      name: '',
      role: 'Katalog / B2B',
      email: 'info@streetpark.eu',
      phone: '+420 773 789 672',
    },
    address: 'Ptáčov 40, 674 01 Třebíč, Tjeckien',
    notes:
      'Tillstånd att använda produktbilder, tekniska uppgifter och dokument från streetpark.eu. Tillverkare visas publikt som STREETPARK. Modellnamn oförändrade, svensk produkttyp framför (t.ex. Cykelställ BIKEME). Inga priser i katalogen. Artikelnummer följer med offerten. Originalbilder utan beskärning/omfärgning. 3D-perspektiv i JPG är bild, inte CAD. CAD (DWG), 3D-arkiv, produktblad och förankringsanvisning publiceras på produktsidan, kopplade till rätt modell. Buss- och cykelväderskydd ingår inte i den här omgången. Hämtat 2026-09-17.',
    productSlugs: [...STREETPARK_SLUGS],
  },
]

export function newSupplierId() {
  return `lev-${crypto.randomUUID().slice(0, 8)}`
}
