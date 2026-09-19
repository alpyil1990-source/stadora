import {
  avfallCatalogSlugs,
  investimCatalogSlugs,
  inoplexCatalogSlugs,
  kuschCatalogSlugs,
  streetparkCatalogSlugs,
  vvzPlayCatalogSlugs,
  zanoCatalogSlugs,
} from './catalog-index'

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
          ...inoplexCatalogSlugs.parkbankar,
          ...zanoCatalogSlugs.parkbankar,
        ],
        draftExamples: ['Parkbänk Muren', 'Parkbänk Silverdal', 'Smart parkbänk Norra Djurgården'],
        filters: [
          { legend: 'Ryggstöd', options: ['Med ryggstöd', 'Utan ryggstöd'] },
          { legend: 'Montering', options: ['Fristående', 'Skruvas i underlaget'] },
          { legend: 'Material', options: ['Arkitektonisk betong', 'Tvättad betong', 'Stål', 'Trä'] },
        ],
      },
      {
        slug: 'betongbankar',
        name: 'Betongbänkar',
        blurb: 'Bänkar i betong för park, torg och gård.',
        productSlugs: [...investimCatalogSlugs.betongbankar, ...inoplexCatalogSlugs.betongbankar],
        draftExamples: [],
        filters: [
          { legend: 'Ryggstöd', options: ['Med ryggstöd', 'Utan ryggstöd'] },
          { legend: 'Montering', options: ['Fristående', 'Skruvas i underlaget'] },
          { legend: 'Material', options: ['Arkitektonisk betong', 'Tvättad betong'] },
        ],
      },
      {
        slug: 'bord-picknick',
        name: 'Bord och picknick',
        blurb: 'Picknickbord och utomhusbord.',
        productSlugs: [
          ...investimCatalogSlugs['bord-picknick'],
          ...streetparkCatalogSlugs['bord-picknick'],
          ...inoplexCatalogSlugs['bord-picknick'],
          ...zanoCatalogSlugs['bord-picknick'],
        ],
        draftExamples: ['Picknickbord Tanto', 'Utomhusbord Långholmen'],
      },
      {
        slug: 'modulara-sitt',
        name: 'Modulära sitt',
        blurb: 'Sittmoduler och sittelement.',
        productSlugs: [
          ...investimCatalogSlugs['modulara-sitt'],
          ...streetparkCatalogSlugs.sitto,
          ...inoplexCatalogSlugs['modulara-sitt'],
          ...zanoCatalogSlugs['modulara-sitt'],
        ],
        draftExamples: ['Sittelement Sandö', 'Sittmodul Hornsberg'],
        liveReady: ['Sittmodul Skarpnäck (grupp 1 på live-sajten, inte inlagd som kort här än)'],
      },
      {
        slug: 'solstolar',
        name: 'Solstolar',
        blurb: 'Parksolstolar och vilstolar för offentlig miljö.',
        productSlugs: [...zanoCatalogSlugs.solstolar],
        draftExamples: [],
      },
      {
        slug: 'fatoljer',
        name: 'Fåtöljer',
        blurb: 'Parkfåtöljer och stolar för offentlig miljö.',
        productSlugs: [...zanoCatalogSlugs.fatoljer],
        draftExamples: [],
      },
      {
        slug: 'barstolar',
        name: 'Barstolar',
        blurb: 'Barstolar för park, torg och uteservering.',
        productSlugs: [...zanoCatalogSlugs.barstolar],
        draftExamples: [],
      },
      {
        slug: 'hangmattor',
        name: 'Hängmattor',
        blurb: 'Hängmattor för offentlig utemiljö.',
        productSlugs: [...zanoCatalogSlugs.hangmattor],
        draftExamples: [],
      },
    ],
  },
  {
    slug: 'vantzon-korridor',
    name: 'Väntzon och korridor',
    blurb: 'Vägghängda fällstolar och fällbänkar för väntrum, korridor och offentliga inomhusmiljöer.',
    children: [
      {
        slug: 'vagghangda-fallstolar',
        name: 'Vägghängda fällstolar och fällbänkar',
        blurb: 'V-Care Fold, vägghängd. En sittplats som stol, två till fyra som bänk. Sits och rygg i trä.',
        productSlugs: [...kuschCatalogSlugs['vagghangda-fallstolar']],
        draftExamples: [],
        filters: [
          { legend: 'Typ', options: ['Fällstol', 'Fällbänk'] },
        ],
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
          ...inoplexCatalogSlugs.papperskorgar,
          ...zanoCatalogSlugs.papperskorgar,
        ],
        draftExamples: ['Papperskorg Djurö', 'Papperskorg Granö'],
      },
      {
        slug: 'askkoppar',
        name: 'Askkoppar',
        blurb: 'Fristående askkoppar.',
        productSlugs: [
          ...avfallCatalogSlugs.askkoppar,
          ...streetparkCatalogSlugs.askkoppar,
          ...inoplexCatalogSlugs.askkoppar,
          ...zanoCatalogSlugs.askkoppar,
        ],
        draftExamples: [],
      },
      {
        slug: 'kallsortering',
        name: 'Källsortering',
        blurb: 'Stationer och behållare med fraktioner.',
        productSlugs: [
          ...avfallCatalogSlugs.kallsortering,
          ...inoplexCatalogSlugs.kallsortering,
          ...zanoCatalogSlugs.kallsortering,
        ],
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
        productSlugs: [
          ...investimCatalogSlugs.cykelstall,
          ...streetparkCatalogSlugs.cykelstall,
          ...inoplexCatalogSlugs.cykelstall,
          ...zanoCatalogSlugs.cykelstall,
        ],
        draftExamples: ['Cykelställ Vasastan', 'Cykelställ Bromma', 'Cykelställ Slussen'],
      },
      {
        slug: 'tak-skydd',
        name: 'Tak och väderskydd',
        blurb: 'Övertäckt parkering.',
        productSlugs: [...inoplexCatalogSlugs['tak-skydd']],
        draftExamples: ['Cykeltak Liljeholmen', 'Cykeltak Norrtull', 'Cykelväderskydd Alvik'],
      },
      {
        slug: 'garage-service',
        name: 'Garage och service',
        blurb: 'Garage, pump och service.',
        productSlugs: [...inoplexCatalogSlugs['garage-service'], ...zanoCatalogSlugs['garage-service']],
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
        slug: 'pergolor',
        name: 'Pergolor',
        blurb: 'Pergolor och tak för park och gård.',
        productSlugs: [...zanoCatalogSlugs.pergolor],
        draftExamples: [],
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
    blurb: 'Gungor, lekställningar, utegym och sportytor för park och gård.',
    children: [
      {
        slug: 'lekstallningar',
        name: 'Lekställningar',
        blurb: 'Kombinerade torn och lekställningar för offentlig lekplats.',
        productSlugs: [...vvzPlayCatalogSlugs.lekstallningar],
        draftExamples: [],
      },
      {
        slug: 'gungor',
        name: 'Gungor',
        blurb: 'Hänggungor för lekplats, från småbarn till fågelbo.',
        productSlugs: [...vvzPlayCatalogSlugs.gungor],
        draftExamples: [],
      },
      {
        slug: 'vippgungor',
        name: 'Vippgungor',
        blurb: 'Vippgungor för två eller flera barn.',
        productSlugs: [...vvzPlayCatalogSlugs.vippgungor],
        draftExamples: [],
      },
      {
        slug: 'rutschkanor',
        name: 'Rutschkanor',
        blurb: 'Fristående rutschkanor och rutschkana med gunga.',
        productSlugs: [...vvzPlayCatalogSlugs.rutschkanor],
        draftExamples: [],
      },
      {
        slug: 'karuseller',
        name: 'Karuseller',
        blurb: 'Karuseller och snurrlek för lekplats.',
        productSlugs: [...vvzPlayCatalogSlugs.karuseller],
        draftExamples: [],
      },
      {
        slug: 'fjaderlek',
        name: 'Fjäderlek',
        blurb: 'Fjädergungor och fjäderdjur.',
        productSlugs: [...vvzPlayCatalogSlugs.fjaderlek],
        draftExamples: [],
      },
      {
        slug: 'lekhus',
        name: 'Lekhus och sandlek',
        blurb: 'Lekhus, temahus och sandlådor.',
        productSlugs: [...vvzPlayCatalogSlugs.lekhus],
        draftExamples: [],
      },
      {
        slug: 'lekplatsutrustning',
        name: 'Övrig lekplatsutrustning',
        blurb: 'Linbanor, lekpaneler, balanslek, broar och övriga lekredskap.',
        productSlugs: [...vvzPlayCatalogSlugs.lekplatsutrustning],
        draftExamples: [],
      },
      {
        slug: 'tillganglig-lek',
        name: 'Tillgänglig lek',
        blurb: 'Lek för flera åldrar och förmågor.',
        productSlugs: [...vvzPlayCatalogSlugs['tillganglig-lek']],
        draftExamples: [],
      },
      {
        slug: 'naturlek',
        name: 'Naturlek',
        blurb: 'Lek i vegetation och naturmaterial.',
        productSlugs: [],
        draftExamples: [],
      },
      {
        slug: 'utegym',
        name: 'Utegym',
        blurb: 'Fasta redskap för träning utomhus.',
        productSlugs: [],
        draftExamples: [],
      },
      {
        slug: 'street-workout',
        name: 'Street workout',
        blurb: 'Stationer för calisthenics och street workout.',
        productSlugs: [],
        draftExamples: [],
      },
      {
        slug: 'multisport-bollplaner',
        name: 'Multisport och bollplaner',
        blurb: 'Bollplan, MUGA och spel.',
        productSlugs: [],
        draftExamples: [],
      },
      {
        slug: 'klattring-hinderbanor',
        name: 'Klättring och hinderbanor',
        blurb: 'Klätterlek, hinder och balansbanor.',
        productSlugs: [...vvzPlayCatalogSlugs['klattring-hinderbanor']],
        draftExamples: [],
      },
      {
        slug: 'hundrastgard-agility',
        name: 'Hundrastgård och agility',
        blurb: 'Rastgårdar och agilitybanor.',
        productSlugs: [],
        draftExamples: [],
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
        productSlugs: [
          ...investimCatalogSlugs.planteringskarl,
          ...inoplexCatalogSlugs.planteringskarl,
          ...zanoCatalogSlugs.planteringskarl,
        ],
        draftExamples: ['Planteringskärl Stadshag', 'Planteringskärl Bergshamra', 'Planteringslåda Mariehäll'],
      },
      {
        slug: 'tradskydd',
        name: 'Trädskydd och galler',
        blurb: 'Skydd och galler kring stam.',
        productSlugs: [...zanoCatalogSlugs.tradskydd],
        draftExamples: [],
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
        productSlugs: [
          ...investimCatalogSlugs.pollare,
          ...streetparkCatalogSlugs.pollare,
          ...inoplexCatalogSlugs.pollare,
          ...zanoCatalogSlugs.pollare,
        ],
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
        productSlugs: [...zanoCatalogSlugs.avsparrning],
        draftExamples: [],
      },
      {
        slug: 'skyltar',
        name: 'Skyltar och tavlor',
        blurb: 'Informationstavlor och skyltstolpar.',
        productSlugs: [...zanoCatalogSlugs.skyltar],
        draftExamples: [],
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
