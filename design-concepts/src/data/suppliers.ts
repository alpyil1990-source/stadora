import { BINSIGNIA_SLUGS } from './binsignia'
import { INVESTIM_SLUGS } from './investim'
import { INOPLEX_SLUGS } from './inoplex'
import { STREETPARK_SLUGS } from './streetpark'
import { ZANO_SLUGS } from './zano'
import { NOVUM_SLUGS } from './novum'
import { KUSCH_VCARE_FOLD_SLUGS } from './kusch-vcare-fold'

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
      'Tillstånd att använda produktbilder, tekniska uppgifter och dokument från streetpark.eu. Tillverkare STREETPARK finns internt för inköp och produktadministration, inte på den publika produktsidan. Modellnamn oförändrade, svensk produkttyp framför (t.ex. Cykelställ BIKEME). Inga priser i den publika katalogen. Listpris och inköpsnetto (EUR) ligger i intern admin på den här sidan. Artikelnummer följer med offerten. Originalbilder utan beskärning/omfärgning. 3D-perspektiv i JPG är bild, inte CAD. CAD (DWG), 3D-arkiv, produktblad och förankringsanvisning publiceras på produktsidan, kopplade till rätt modell. Kundversion av produktblad utan STREETPARK-logotyp, webbadress och materialprov-länk; original internt. Buss- och cykelväderskydd ingår inte i den här omgången. Hämtat 2026-09-17.',
    productSlugs: [...STREETPARK_SLUGS],
  },
  {
    id: 'inoplex',
    name: 'INOPLEX',
    status: 'aktiv',
    orgNr: '',
    legalName: 'INOPLEX',
    website: 'https://inoplex.pl/en',
    mediaSource: 'https://inoplex.pl/en',
    contact: {
      name: '',
      role: 'Katalog / B2B',
      email: 'inoplex@inoplex.pl',
      phone: '+48 22 460 54 30',
    },
    address: 'ul. Przewodowa 40, 04-874 Warszawa, Polen. Produktion: ul. Bolesława Chrobrego 26, 11-300 Biskupiec.',
    notes:
      'Tillstånd att använda produktbilder. Tillverkare visas inte publikt. Modellkod följer med offerten. Inköpspris saknas i katalogen — lämna tomt, aldrig 0 kr. Leverantörsoffert krävs före kundpris. Baseboards/socklar är undantagna. Kundversion av produktblad utan leverantörens logotyp och kontaktuppgifter; original internt. Hämtat 2026-09-17.',
    productSlugs: [...INOPLEX_SLUGS],
  },
  {
    id: 'zano',
    name: 'ZANO',
    status: 'invantar_underlag',
    orgNr: '',
    legalName: 'ZANO Mirosław Zarotyński',
    website: 'https://www.zano.se',
    mediaSource: 'https://www.zano.se/produkter',
    contact: {
      name: '',
      role: 'Katalog / B2B',
      email: 'office@zano.pl',
      phone: '+48 12 200 20 53',
    },
    address: 'Lindego 7A, 30-148 Kraków, Polen',
    notes:
      'ZANO-sortiment utom kategorin Övrigt (fågelmatare, lyktor, desinfektionsstationer). Tillstånd att använda produktbilder under förutsättning att ZANO-märkning finns kvar. Produktnamn utan ZANO; Tillverkare: Zano står i produktbeskrivningen. Modellnummer följer med offerten. Inköpspris saknas — lämna tomt, aldrig 0 kr. Leverantörsoffert krävs. Dokument oförändrade, inklusive logotyp. Hämtat 2026-09-17.',
    productSlugs: [...ZANO_SLUGS],
  },
  {
    id: 'novum',
    name: 'NOVUM Sp. z o.o.',
    status: 'invantar_underlag',
    orgNr: '0000900672',
    vatNr: 'PL7451796890',
    legalName: 'NOVUM Sp. z o.o.',
    website: 'https://novum4kids.com',
    mediaSource: 'https://novum4kids.com/fitness-devices/?per_page=60',
    contact: {
      name: '',
      role: 'Katalog / B2B',
      email: 'export@novum4kids.com',
      phone: '+48 89 621 21 12',
    },
    address: 'ul. Gnieźnieńska 2A, 12-100 Szczytno, Polen',
    notes:
      'Testimport 2026-09-18: endast Runner 44103W och Airwalker 4403Z från Fitness Devices. Produkter opublicerade, intern förhandsgranskning. Tillverkare NOVUM registreras internt och visas inte publikt. Alla originalfiler internal_only tills skriftligt godkännande finns för extern nedladdning. Inga priser. Offertförfrågan. Portaluppgifter ligger i miljövariabler, aldrig i källkod.',
    productSlugs: [...NOVUM_SLUGS],
  },
  {
    id: 'kusch-co',
    name: 'Kusch+Co / Nowy Styl',
    status: 'aktiv',
    orgNr: '',
    legalName: 'Kusch+Co GmbH (Nowy Styl)',
    website: 'https://www.kusch.com',
    mediaSource: 'https://www.kusch.com/en/v-care/beam-seating/',
    contact: {
      name: '',
      role: 'Katalog / B2B',
      email: 'info@kusch.com',
      phone: '',
    },
    address: 'Hallener Str. 1–9, 57439 Attendorn, Tyskland',
    notes:
      'Tillstånd att använda produktbilder och material på webbplatsen, i offerter och kundprojekt. Tillverkare Kusch+Co endast internt, inte på den publika produktsidan eller offerten. Ett produktkort för vägghängd V-Care Fold (1U–4U MW, trä). Inga klädda varianter i den här omgången. Inga golvstående Fold och inga vanliga V-Care-bänkar. Produktkod följer med offerten; inget påhittat KVCR-beställningsnummer. Inga priser publikt. Prislista och inköpsvillkor endast internt. Modellspecifika Fold-blad/CAD saknas i öppen nedladdning; TE/TB/PRM-ritningar ska inte användas. Hämtat 2026-09-18 från kusch.com och nowystyl.com.',
    productSlugs: [...KUSCH_VCARE_FOLD_SLUGS],
  },
]

export function newSupplierId() {
  return `lev-${crypto.randomUUID().slice(0, 8)}`
}
