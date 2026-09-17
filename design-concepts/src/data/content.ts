import { binsigniaProducts } from './binsignia'
import { investimProducts } from './investim'
import { streetparkProducts } from './streetpark'
import { catalog } from './catalog'

export type AreaId = 'offentlig' | 'skola' | 'vard'

export type ProductImage = {
  src: string
  alt: string
  kind: 'studio' | 'site' | 'detail'
  /** Matches a color option name when this file shows that finish. */
  color?: string
  /** Matches a size option name when this file shows that size. */
  size?: string
}

export type ColorOption = {
  name: string
  hex?: string
}

export type SizeOption = {
  name: string
  sku?: string
  summary?: string
  dimensions?: { label: string; value: string }[]
  weight?: string
  capacity?: string
  /** STREETPARK type icon from the supplier product page. */
  icon?: string
}

export type MaterialFinish = {
  name: string
  code: 'PC' | 'SST'
  sku: string
  environment?: string
  sourceUrl?: string
  standardFeatures?: string[]
  optionalFeatures?: string[]
}

export type ProductDocumentKind =
  | 'drawing'
  | 'perspective'
  | 'datasheet'
  | 'mounting'
  | 'anchoring'
  | 'cad'
  | 'warranty'
  | 'maintenance'
  | 'material'
  | 'image'
  | 'other'

export type ProductDocument = {
  title: string
  /** Swedish document type, e.g. Måttritning. Combined with format in the UI. */
  typeLabel: string
  /** Actual file format, e.g. JPG or PDF. */
  format: string
  href: string
  kind: ProductDocumentKind
  previewable?: boolean
  /** Supplier model/article the file belongs to, e.g. SKM1. */
  variant?: string
  appliesTo?: string
  sourceUrl?: string
  fetchedAt?: string
}

export type Product = {
  slug: string
  name: string
  sku?: string
  area: AreaId
  category: string
  categorySlug: string
  subcategory: string
  subcategorySlug: string
  summary: string
  description: string
  images: ProductImage[]
  material?: string
  manufacturer?: string
  sourceUrl?: string
  cement?: string
  wood?: string
  dimensions?: { label: string; value: string }[]
  weight?: string
  mounting?: string[]
  capacity?: string
  environment?: string
  leadTime?: string
  warranty?: string
  medicalClass?: string
  manufacturerQms?: string
  colors?: Array<string | ColorOption>
  sizes?: SizeOption[]
  defaultSize?: string
  /** Label for the size radios. Internal state key remains Storlek. */
  sizeLegend?: string
  /** Label for the colour swatches. Internal state key remains Kulör. */
  colorLegend?: string
  materials?: MaterialFinish[]
  defaultMaterial?: string
  /** Free-text RAL on the quote line. No swatch catalog unless colors[] exists. */
  ralInQuote?: boolean
  variants?: { label: string; options: string[] }[]
  related: string[]
  imageNote?: string
  documentPolicy?: string
  documents?: ProductDocument[]
  /** Supplier article numbers may follow the quote line (STREETPARK). */
  quoteShowsSku?: boolean
  fetchedAt?: string
  reviewNote?: string
}

/** STADORA's own article numbers (ST-…) may be shown on the public site. Supplier SKUs stay in admin. */
export function isStadoraArticleNumber(sku?: string | null) {
  return Boolean(sku && /^ST-/i.test(sku.trim()))
}

/** Quote lines may show STREETPARK article numbers; other supplier SKUs stay in admin. */
export function quoteShowsArticleNumber(product?: Product | null, sku?: string | null) {
  if (isStadoraArticleNumber(sku)) return true
  return Boolean(product?.quoteShowsSku && sku)
}

export function documentsForVariant(product: Product, variant?: string | null) {
  const docs = product.documents ?? []
  if (!variant) return docs.filter((d) => !d.variant)
  return docs.filter((d) => !d.variant || d.variant === variant)
}

export const company = {
  name: 'STADORA',
  legal: 'Relicon AB',
  orgNr: '559174-4551',
  vat: 'SE559174455501',
  address: ['Plantslingan 36', '142 51 Skogås, Sverige'],
  email: 'info@stadora.se',
  web: 'stadora.se',
}

export const areas: Record<
  AreaId,
  { label: string; tagline: string; path: string; accent: string }
> = {
  offentlig: {
    label: 'Offentlig miljö',
    tagline: 'Professionella miljöer',
    path: '/',
    accent: 'sage',
  },
  skola: {
    label: 'Skola',
    tagline: 'Skola och lärmiljö',
    path: '/skola',
    accent: 'school',
  },
  vard: {
    label: 'Vård',
    tagline: 'Vård',
    path: '/vard',
    accent: 'care',
  },
}

export const publicNav = {
  products: catalog.map((c) => ({
    name: c.name,
    href: `/produkter/${c.slug}`,
    children: c.children.map((s) => ({
      name: s.name,
      href: `/produkter/${c.slug}/${s.slug}`,
    })),
  })),
}

/** Parkmöbler: fält från live-sajten. Avfall: spec från leverantörens underlag, utan att namnge leverantören publikt. */
export const products: Record<string, Product> = {
  'parkbank-arsta': {
    slug: 'parkbank-arsta',
    name: 'Parkbänk Årsta',
    sku: 'ST-1208',
    area: 'offentlig',
    category: 'Parkmöbler',
    categorySlug: 'parkmobler',
    subcategory: 'Parkbänkar',
    subcategorySlug: 'parkbankar',
    summary: 'Bänk med ryggstöd i arkitektonisk betong med trälister.',
    description:
      'Bänk med ryggstöd i arkitektonisk betong med trälister. Tillverkas i arkitektonisk betong. Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand.',
    images: [
      {
        src: '/images/arsta-studio.png',
        alt: 'Parkbänk Årsta, studiofoto',
        kind: 'studio',
      },
      {
        src: '/images/arsta-miljo.jpg',
        alt: 'Parkbänk Årsta i utemiljö',
        kind: 'site',
      },
    ],
    material: 'Arkitektonisk betong med trälister',
    cement:
      'Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand.',
    dimensions: [
      { label: 'Total längd', value: '190 cm' },
      { label: 'Sittlängd', value: '150 cm' },
      { label: 'Sitthöjd', value: '50 cm' },
      { label: 'Total höjd', value: '85 cm' },
      { label: 'Bänkbredd', value: '57 cm' },
    ],
    weight: '150 kg',
    mounting: ['Fristående', 'Kan skruvas fast i underlaget'],
    related: ['parkbank-hammarby', 'parkbank-aspudden', 'parkbank-grondal'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  'parkbank-hammarby': {
    slug: 'parkbank-hammarby',
    name: 'Parkbänk Hammarby',
    sku: 'ST-1207',
    area: 'offentlig',
    category: 'Parkmöbler',
    categorySlug: 'parkmobler',
    subcategory: 'Parkbänkar',
    subcategorySlug: 'parkbankar',
    summary: 'Bänk utan ryggstöd i arkitektonisk betong med trälister.',
    description:
      'Bänk utan ryggstöd i arkitektonisk betong med trälister. Tillverkas i arkitektonisk betong. Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand.',
    images: [
      {
        src: '/images/hammarby-studio.png',
        alt: 'Parkbänk Hammarby, studiofoto',
        kind: 'studio',
      },
      {
        src: '/images/hammarby-miljo.jpg',
        alt: 'Parkbänk Hammarby i utemiljö',
        kind: 'site',
      },
    ],
    material: 'Arkitektonisk betong med trälister',
    cement:
      'Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand.',
    dimensions: [
      { label: 'Total längd', value: '190 cm' },
      { label: 'Sittlängd', value: '150 cm' },
      { label: 'Sitthöjd', value: '50 cm' },
      { label: 'Bänkbredd', value: '50 cm' },
    ],
    weight: '130 kg',
    mounting: ['Fristående', 'Kan skruvas fast i underlaget'],
    related: ['parkbank-arsta', 'parkbank-grondal', 'parkbank-enskede'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  'parkbank-grondal': {
    slug: 'parkbank-grondal',
    name: 'Parkbänk Gröndal',
    sku: 'ST-1210',
    area: 'offentlig',
    category: 'Parkmöbler',
    categorySlug: 'parkmobler',
    subcategory: 'Parkbänkar',
    subcategorySlug: 'parkbankar',
    summary: 'Bänk utan ryggstöd i arkitektonisk betong med trälister.',
    description:
      'Bänk utan ryggstöd i arkitektonisk betong med trälister. Tillverkas i arkitektonisk betong.',
    images: [
      {
        src: '/images/grondal-studio.png',
        alt: 'Parkbänk Gröndal, studiofoto',
        kind: 'studio',
      },
    ],
    material: 'Arkitektonisk betong med trälister',
    dimensions: [
      { label: 'Total längd', value: '200 cm' },
      { label: 'Sittlängd', value: '170 cm' },
      { label: 'Sitthöjd', value: '45 cm' },
      { label: 'Bänkbredd', value: '45 cm' },
    ],
    weight: '230 kg',
    mounting: ['Fristående', 'Kan skruvas fast i underlaget'],
    related: ['parkbank-hammarby', 'parkbank-aspudden'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  'parkbank-aspudden': {
    slug: 'parkbank-aspudden',
    name: 'Parkbänk Aspudden',
    sku: 'ST-1211',
    area: 'offentlig',
    category: 'Parkmöbler',
    categorySlug: 'parkmobler',
    subcategory: 'Parkbänkar',
    subcategorySlug: 'parkbankar',
    summary: 'Bänk med ryggstöd i arkitektonisk betong med trälister.',
    description:
      'Bänk med ryggstöd i arkitektonisk betong med trälister. Tillverkas i arkitektonisk betong.',
    images: [
      {
        src: '/images/aspudden-studio.png',
        alt: 'Parkbänk Aspudden, studiofoto',
        kind: 'studio',
      },
    ],
    material: 'Arkitektonisk betong med trälister',
    dimensions: [
      { label: 'Total längd', value: '200 cm' },
      { label: 'Sittlängd', value: '179 cm' },
      { label: 'Sitthöjd', value: '45 cm' },
      { label: 'Höjd med ryggstöd', value: '90 cm' },
      { label: 'Bänkbredd', value: '45 cm' },
    ],
    weight: '250 kg',
    mounting: ['Fristående', 'Kan skruvas fast i underlaget'],
    related: ['parkbank-arsta', 'parkbank-grondal'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  'parkbank-enskede': {
    slug: 'parkbank-enskede',
    name: 'Parkbänk Enskede',
    sku: 'ST-1212',
    area: 'offentlig',
    category: 'Parkmöbler',
    categorySlug: 'parkmobler',
    subcategory: 'Parkbänkar',
    subcategorySlug: 'parkbankar',
    summary: 'Bänk med ryggstöd i arkitektonisk betong och trä.',
    description:
      'Bänk med ryggstöd i arkitektonisk betong och trä. Tillverkas i arkitektonisk betong.',
    images: [
      {
        src: '/images/enskede-01.jpg',
        alt: 'Parkbänk Enskede',
        kind: 'studio',
      },
      {
        src: '/images/enskede-02.jpg',
        alt: 'Parkbänk Enskede, detalj',
        kind: 'detail',
      },
    ],
    material: 'Arkitektonisk betong och trä',
    dimensions: [
      { label: 'Sittlängd', value: '160 cm' },
      { label: 'Total längd', value: '180 cm' },
      { label: 'Sitthöjd', value: '45 cm' },
      { label: 'Total höjd', value: '85 cm' },
      { label: 'Sittdjup', value: '46 cm' },
      { label: 'Bänkbredd', value: '80 cm' },
    ],
    mounting: [
      'Fristående',
      'Skruvas fast i hårdgjort underlag med monteringssats',
    ],
    related: ['parkbank-arsta', 'parkbank-hammarby'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  'papperskorg-rodberga-100': {
    slug: 'papperskorg-rodberga-100',
    name: 'Papperskorg Rödberga',
    sku: 'ST-1199',
    area: 'offentlig',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Papperskorgar',
    subcategorySlug: 'papperskorgar',
    summary:
      'Papperskorg i arkitektonisk betong med tak i cortenstål. Två höjder: 80 cm och 100 cm.',
    description:
      'Papperskorg i arkitektonisk betong med tak i cortenstål. Tillverkas i arkitektonisk betong. Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand. På live-sajten är 80 och 100 två artiklar; här är de en serie så att bild och mått följer storleksvalet.',
    images: [
      {
        src: '/images/rodberga-studio.png',
        alt: 'Papperskorg Rödberga 100 cm, studiofoto',
        kind: 'studio',
        size: '100 cm',
      },
      {
        src: '/images/rodberga-miljo.jpg',
        alt: 'Papperskorg Rödberga 100 cm i utemiljö',
        kind: 'site',
        size: '100 cm',
      },
    ],
    material: 'Arkitektonisk betong, tak i cortenstål',
    cement:
      'Flerkomponents portlandcement CM II/A-M (S-LL) 52,5N, hållfasthetsklass 52,5, tvättad ballast och sorterad sand.',
    defaultSize: '100 cm',
    sizes: [
      {
        name: '80 cm',
        sku: 'ST-1198',
        summary: 'Höjd med tak 80 cm.',
        dimensions: [
          { label: 'Bas', value: '45 × 45 cm' },
          { label: 'Höjd', value: '60 cm' },
          { label: 'Höjd med tak', value: '80 cm' },
          { label: 'Volym med innerkärl', value: 'ca 50 l' },
        ],
        weight: '150 kg',
        capacity: 'ca 50 l',
      },
      {
        name: '100 cm',
        sku: 'ST-1199',
        summary: 'Höjd med tak 100 cm.',
        dimensions: [
          { label: 'Bas', value: '45 × 45 cm' },
          { label: 'Höjd', value: '80 cm' },
          { label: 'Höjd med tak', value: '100 cm' },
          { label: 'Volym med innerkärl', value: 'ca 75 l' },
        ],
        weight: '205 kg',
        capacity: 'ca 75 l',
      },
    ],
    related: ['askkopp-luna'],
    imageNote: 'Bilden visar ett exempelutförande. Färgåtergivning på skärm kan avvika.',
  },
  ...investimProducts,
  ...binsigniaProducts,
  ...streetparkProducts,
  'akutvagn-genius': {
    slug: 'akutvagn-genius',
    name: 'Akutvagn Genius',
    area: 'vard',
    category: 'Vagnar',
    categorySlug: 'vagnar',
    subcategory: 'Akutvagnar',
    subcategorySlug: 'akutvagnar',
    summary:
      'Akutvagn med lådor i flera höjder, arbetsskiva i ABS och 125 mm hjul. Medicinteknisk produkt klass I.',
    description:
      'Akutvagn för akutrum, vårdavdelning och mottagning. Stomme i pulverlackerad stålplåt RAL 7035 med arbetsskiva i ABS. Lådindelning 2×75 mm, 1×100 mm, 1×150 mm och 2×200 mm. Hjul 125 mm.',
    images: [
      { src: '/images/genius.png', alt: 'Akutvagn Genius', kind: 'studio' },
    ],
    material: 'Pulverlackerad stålplåt RAL 7035, arbetsskiva i ABS',
    dimensions: [{ label: 'B × D × H', value: '650 × 600 × 1110 mm' }],
    medicalClass: 'Medicinteknisk produkt klass I',
    manufacturerQms:
      'Tillverkarens ledningssystem är certifierat enligt ISO 9001, ISO 14001 och ISO 13485:2016.',
    related: [],
  },
  'ada-melaminskap': {
    slug: 'ada-melaminskap',
    name: 'Ada – melaminskåp med dörrar, lås och nyckel',
    area: 'skola',
    category: 'Förvaring',
    categorySlug: 'forvaring',
    subcategory: 'Skolförvaring',
    subcategorySlug: 'skolforvaring',
    summary: 'Melaminskåp med dörrar, lås och nyckel.',
    description:
      'Melaminskåp med dörrar, lås och nyckel. Finns i 3 kulörer: ljus terrakotta, ljusblå, lönn vit.',
    images: [{ src: '/images/ada.png', alt: 'Ada melaminskåp', kind: 'studio' }],
    colors: ['Ljusblå', 'Ljus terrakotta', 'Lönn vit'],
    related: [],
  },
}

export { BINSIGNIA_SLUGS } from './binsignia'
export { INVESTIM_SLUGS } from './investim'
export { STREETPARK_SLUGS } from './streetpark'

export const binsigniaDraft = [
  products['askkopp-luna'],
  products['kallsortering-albris'],
  products['kallsortering-bernina'],
  products['kallsortering-eiger'],
  products['kallsortering-gemini'],
]

export const benches = [
  products['parkbank-hammarby'],
  products['parkbank-arsta'],
  products['parkbank-grondal'],
  products['parkbank-aspudden'],
  products['parkbank-enskede'],
]

export const careProducts = [
  products['akutvagn-genius'],
  {
    slug: 'akutvagn-tornado-life',
    name: 'Akutvagn Tornado Life',
    summary:
      'Akutvagn med antimikrobiell pulverlackering och detaljer i teknopolymer. Medicinteknisk produkt klass I.',
    category: 'Vagnar',
  },
  {
    slug: 'lakemedelsvagn-zephiro',
    name: 'Läkemedelsvagn Zephiro',
    summary:
      'Läkemedelsvagn med sju lådor, läkemedelsfack och centrallås. Medicinteknisk produkt klass I.',
    category: 'Vagnar',
  },
  {
    slug: 'medicinskap-medcab-iso',
    name: 'Medicinskåp Medcab ISO',
    summary:
      'Medicinskåp med glasdörrar och nyckellås, förberett för ISO-korgar. ISO-korgar är tillval.',
    category: 'Förvaring',
  },
]

export function productPath(p: Product) {
  if (p.area === 'vard') return `/vard/produkt/${p.slug}`
  if (p.area === 'skola') return `/skola/produkt/${p.slug}`
  return `/produkt/${p.slug}`
}
