import { avfallCatalogSlugs } from './binsignia-rest'
import { investimCatalogSlugs } from './investim'
import { streetparkCatalogSlugs } from './streetpark'

export type CatalogStatus = 'published' | 'needs_work' | 'draft'

export type SubcategoryDef = {
  slug: string
  name: string
  blurb: string
  productSlugs: string[]
  /** Live-SKU-namn som finns i inventeringen men inte ska visas som köpbara kort. */
  draftExamples: string[]
  /** Produkter som klarar miniminivån på live men inte är inlagda som kort i konceptet. */
  liveReady?: string[]
  filters?: { legend: string; options: string[] }[]
}

export type CategoryDef = {
  slug: string
  name: string
  blurb: string
  children: SubcategoryDef[]
}

export const catalog: CategoryDef[] = [
  {
    slug: 'parkmobler',
    name: 'Parkmöbler',
    blurb: 'Bänkar, bord och sittsystem för parker, gårdar och gemensamma platser.',
    children: [
      {
        slug: 'parkbankar',
        name: 'Parkbänkar',
        blurb: 'Bänkar med och utan ryggstöd.',
        productSlugs: [
          'parkbank-hammarby',
          'parkbank-arsta',
          'parkbank-grondal',
          'parkbank-aspudden',
          'parkbank-enskede',
          ...investimCatalogSlugs.parkbankar,
          ...streetparkCatalogSlugs.parkbankar,
        ],
        draftExamples: ['Parkbänk Muren', 'Parkbänk Silverdal', 'Smart parkbänk Norra Djurgården'],
        filters: [
          { legend: 'Ryggstöd', options: ['Med ryggstöd', 'Utan ryggstöd'] },
          { legend: 'Montering', options: ['Fristående', 'Skruvas i underlaget'] },
          { legend: 'Material', options: ['Arkitektonisk betong', 'Tvättad betong', 'Stål', 'Trä'] },
        ],
      },
      {
        slug: 'bord-picknick',
        name: 'Bord och picknick',
        blurb: 'Picknickbord och utomhusbord.',
        productSlugs: [
          ...investimCatalogSlugs['bord-picknick'],
          ...streetparkCatalogSlugs['bord-picknick'],
        ],
        draftExamples: ['Picknickbord Tanto', 'Utomhusbord Långholmen'],
      },
      {
        slug: 'modulara-sitt',
        name: 'Modulära sitt',
        blurb: 'Sittmoduler och sittelement.',
        productSlugs: [...investimCatalogSlugs['modulara-sitt'], ...streetparkCatalogSlugs.sitto],
        draftExamples: ['Sittelement Sandö', 'Sittmodul Hornsberg'],
        liveReady: ['Sittmodul Skarpnäck (grupp 1 på live-sajten, inte inlagd som kort här än)'],
      },
    ],
  },
  {
    slug: 'avfall-atervinning',
    name: 'Avfall och återvinning',
    blurb: 'Kärl, askkoppar, källsortering och miljöhus.',
    children: [
      {
        slug: 'papperskorgar',
        name: 'Papperskorgar',
        blurb: 'Fristående kärl för park, torg och gård.',
        productSlugs: [
          ...avfallCatalogSlugs.papperskorgar,
          ...investimCatalogSlugs.papperskorgar,
          ...streetparkCatalogSlugs.papperskorgar,
        ],
        draftExamples: ['Papperskorg Djurö', 'Papperskorg Granö'],
      },
      {
        slug: 'askkoppar',
        name: 'Askkoppar',
        blurb: 'Fristående askkoppar.',
        productSlugs: [...avfallCatalogSlugs.askkoppar, ...streetparkCatalogSlugs.askkoppar],
        draftExamples: [],
      },
      {
        slug: 'kallsortering',
        name: 'Källsortering',
        blurb: 'Stationer och behållare med fraktioner.',
        productSlugs: avfallCatalogSlugs.kallsortering,
        draftExamples: [],
        filters: [
          { legend: 'Material', options: ['Pulverlackerad stålplåt', 'Rostfritt stål'] },
          { legend: 'Fraktioner', options: ['1', '2', '3', '4'] },
        ],
      },
      {
        slug: 'miljohus',
        name: 'Miljöhus',
        blurb: 'Inhägnader och hus för avfall.',
        productSlugs: [],
        draftExamples: ['Miljöhus Hagalund', 'Miljöhus Tureberg', 'Avfallsinhägnad Bagarmossen'],
      },
    ],
  },
  {
    slug: 'cykelparkering',
    name: 'Cykelparkering',
    blurb: 'Ställ, tak, garage och service.',
    children: [
      {
        slug: 'cykelstall',
        name: 'Cykelställ',
        blurb: 'Markstående ställ.',
        productSlugs: [...investimCatalogSlugs.cykelstall, ...streetparkCatalogSlugs.cykelstall],
        draftExamples: ['Cykelställ Vasastan', 'Cykelställ Bromma', 'Cykelställ Slussen'],
      },
      {
        slug: 'tak-skydd',
        name: 'Tak och väderskydd',
        blurb: 'Övertäckt parkering.',
        productSlugs: [],
        draftExamples: ['Cykeltak Liljeholmen', 'Cykeltak Norrtull', 'Cykelväderskydd Alvik'],
      },
      {
        slug: 'garage-service',
        name: 'Garage och service',
        blurb: 'Garage, pump och service.',
        productSlugs: [],
        draftExamples: ['Cykelgarage Hagastaden', 'Cykelservicestation Rosendal', 'Pumpstation Årstadal'],
      },
    ],
  },
  {
    slug: 'vaderskydd',
    name: 'Väderskydd och hållplatser',
    blurb: 'Kurer, entréer och sanitetsmoduler.',
    children: [
      {
        slug: 'busskurer',
        name: 'Busskurer och hållplatser',
        blurb: 'Väntytor vid kollektivtrafik.',
        productSlugs: [],
        draftExamples: ['Busskur Hagsätra', 'Busskur Kungsholmen', 'Väderskydd Kvarnholmen'],
      },
      {
        slug: 'entreskydd',
        name: 'Entréskydd',
        blurb: 'Skydd vid entré.',
        productSlugs: [],
        draftExamples: ['Entréskydd Solberga'],
      },
      {
        slug: 'sanitet',
        name: 'Sanitet',
        blurb: 'WC- och sanitetsmoduler.',
        productSlugs: [],
        draftExamples: ['Automatisk WC Slussen', 'Sanitetsmodul Tantolunden', 'WC-modul Hagaparken'],
      },
    ],
  },
  {
    slug: 'lek-aktivitet',
    name: 'Lek och aktivitet',
    blurb: 'Gungor, lekställ, lekhus, balans, utegym och sportytor. Underkategorier finns även när produkterna fortfarande är utkast.',
    children: [
      {
        slug: 'gungor',
        name: 'Gungor',
        blurb: 'Gungställningar och gungor.',
        productSlugs: [],
        draftExamples: ['Gungställning Sandvik'],
      },
      {
        slug: 'lekstallningar',
        name: 'Lekställningar',
        blurb: 'Klätterställning, torn och kombinerad lek.',
        productSlugs: [],
        draftExamples: ['Klätterställning Ekhagen'],
      },
      {
        slug: 'lekhus',
        name: 'Lekhus',
        blurb: 'Lekhus för rollek.',
        productSlugs: [],
        draftExamples: ['Lekhus Björkhaga'],
      },
      {
        slug: 'balans-rorelse',
        name: 'Balans och rörelse',
        blurb: 'Balansbanor, hinder och linor.',
        productSlugs: [],
        draftExamples: ['Balansstation Örhem', 'Hopphinder Flaten'],
      },
      {
        slug: 'utegym',
        name: 'Utegym',
        blurb: 'Fasta redskap för träning utomhus.',
        productSlugs: [],
        draftExamples: ['Utegym Hammarbyhöjden', 'Utegym Näsby', 'Street workout Telefonplan'],
      },
      {
        slug: 'sportytor',
        name: 'Sportytor',
        blurb: 'Bollplan, MUGA och spel.',
        productSlugs: [],
        draftExamples: [
          'Bollplan Hökmossen',
          'MUGA-anläggning Järvafältet',
          'Multisportarena Hjorthagen',
          'Pingisbord Vällingby',
        ],
      },
    ],
  },
  {
    slug: 'plantering',
    name: 'Plantering',
    blurb: 'Kärl, lådor och trädskydd.',
    children: [
      {
        slug: 'planteringskarl',
        name: 'Planteringskärl',
        blurb: 'Kärl och lådor.',
        productSlugs: [...investimCatalogSlugs.planteringskarl],
        draftExamples: ['Planteringskärl Stadshag', 'Planteringskärl Bergshamra', 'Planteringslåda Mariehäll'],
      },
      {
        slug: 'tradskydd',
        name: 'Trädskydd och galler',
        blurb: 'Skydd och galler kring stam.',
        productSlugs: [],
        draftExamples: ['Trädgaller Odenplan', 'Trädskydd Haga'],
      },
    ],
  },
  {
    slug: 'pollare-racken',
    name: 'Pollare och räcken',
    blurb: 'Pollare, fällpollare och avspärrning.',
    children: [
      {
        slug: 'pollare',
        name: 'Pollare',
        blurb: 'Fasta och fällbara pollare.',
        productSlugs: [...investimCatalogSlugs.pollare, ...streetparkCatalogSlugs.pollare],
        draftExamples: ['Pollare Skylten', 'Pollare Stigen', 'Fällpollare Enskede'],
        filters: [
          { legend: 'Form', options: ['Fyrkantig', 'Rund', 'Sexkantig', 'Åttkantig'] },
          { legend: 'Material', options: ['Tvättad betong', 'Arkitektonisk betong'] },
        ],
      },
      {
        slug: 'avsparrning',
        name: 'Avspärrning',
        blurb: 'Stolpar och räcken.',
        productSlugs: [],
        draftExamples: ['Avspärrningsstolpe Gärdet'],
      },
    ],
  },
]

export function categoryPath(category: CategoryDef) {
  return `/produkter/${category.slug}`
}

export function subcategoryPath(category: CategoryDef, sub: SubcategoryDef) {
  return `/produkter/${category.slug}/${sub.slug}`
}

export function findCategory(slug: string | undefined) {
  return catalog.find((c) => c.slug === slug)
}

export function findSubcategory(category: CategoryDef, slug: string | undefined) {
  return category.children.find((s) => s.slug === slug)
}

export function subcategoryStatus(sub: SubcategoryDef): CatalogStatus {
  if (sub.productSlugs.length > 0) return 'published'
  if (sub.draftExamples.length > 0) return 'draft'
  return 'draft'
}
