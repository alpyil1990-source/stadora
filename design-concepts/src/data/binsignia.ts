import type { MaterialFinish, Product, ProductImage, SizeOption } from './content'

export const BINSIGNIA_SLUGS = [
  'askkopp-luna',
  'kallsortering-albris',
  'kallsortering-bernina',
  'kallsortering-eiger',
  'kallsortering-gemini',
] as const

export const MATERIAL_PC = 'Pulverlackerad stålplåt'
export const MATERIAL_SST = 'Rostfritt stål'

const REVIEW =
  'Utkast för granskning: fem BINSIGNIA-modeller. Övriga modeller från binsignia.com är inte inlagda än.'

const DOCS =
  'Ritningar och PDF-datablad publiceras inte här. BINSIGNIA lämnar detaljerade ritningar och datablad selektivt, per projekt eller order, när det krävs av er kund. Tillstånd finns att använda produktfoton, beskrivningar och övergripande specifikationer på stadora.se.'

const LEAD =
  'Cirka 5 veckor från orderbekräftelse (förskottsbetalning). Kan justeras vid större volym.'

const WARRANTY = '12 månader från leverans.'

const LABELING = {
  label: 'Märkning',
  options: [
    'Standard svensk sorteringsmärkning',
    'Utan märkning',
    'Anpassad märkning',
  ],
}

const IMAGE_NOTE =
  'Foto från binsignia.com, med leverantörens tillstånd. Bilden visar ett exempelutförande. Ingen unik produktbild per RAL-kulör eller per kapacitet i det här utkastet. Färgåtergivning på skärm kan avvika.'

function photo(
  file: string,
  alt: string,
  extra?: Partial<ProductImage>,
): ProductImage {
  return { src: `/images/binsignia/${file}`, alt, kind: 'studio', ...extra }
}

function sizes(
  rows: Array<{ name: string; dim: string; capacity: string }>,
): SizeOption[] {
  return rows.map((r) => ({
    name: r.name,
    summary: r.capacity,
    capacity: r.capacity,
    dimensions: [{ label: 'B × D × H', value: r.dim }],
  }))
}

/** 12 configs used by ALBRIS, BERNINA and GEMINI (same grid, different measures). */
const ALBRIS_SIZES = sizes([
  { name: '1 × 35 l', dim: '24 × 24 × 75 cm', capacity: '1 × 35 l' },
  { name: '1 × 60 l', dim: '29 × 29 × 85 cm', capacity: '1 × 60 l' },
  { name: '1 × 100 l', dim: '34 × 34 × 95 cm', capacity: '1 × 100 l' },
  { name: '2 × 35 l', dim: '48 × 24 × 75 cm', capacity: '2 × 35 l' },
  { name: '2 × 60 l', dim: '58 × 29 × 85 cm', capacity: '2 × 60 l' },
  { name: '2 × 100 l', dim: '66 × 34 × 95 cm', capacity: '2 × 100 l' },
  { name: '3 × 35 l', dim: '70 × 24 × 75 cm', capacity: '3 × 35 l' },
  { name: '3 × 60 l', dim: '85 × 29 × 85 cm', capacity: '3 × 60 l' },
  { name: '3 × 100 l', dim: '100 × 34 × 95 cm', capacity: '3 × 100 l' },
  { name: '4 × 35 l', dim: '96 × 24 × 75 cm', capacity: '4 × 35 l' },
  { name: '4 × 60 l', dim: '116 × 29 × 85 cm', capacity: '4 × 60 l' },
  { name: '4 × 100 l', dim: '132 × 34 × 95 cm', capacity: '4 × 100 l' },
])

const BERNINA_SIZES = sizes([
  { name: '1 × 35 l', dim: '23 × 23 × 74 cm', capacity: '1 × 35 l' },
  { name: '1 × 60 l', dim: '28 × 28 × 84 cm', capacity: '1 × 60 l' },
  { name: '1 × 100 l', dim: '33 × 33 × 94 cm', capacity: '1 × 100 l' },
  { name: '2 × 35 l', dim: '46 × 23 × 74 cm', capacity: '2 × 35 l' },
  { name: '2 × 60 l', dim: '56 × 28 × 84 cm', capacity: '2 × 60 l' },
  { name: '2 × 100 l', dim: '66 × 33 × 94 cm', capacity: '2 × 100 l' },
  { name: '3 × 35 l', dim: '69 × 23 × 74 cm', capacity: '3 × 35 l' },
  { name: '3 × 60 l', dim: '84 × 28 × 84 cm', capacity: '3 × 60 l' },
  { name: '3 × 100 l', dim: '99 × 33 × 94 cm', capacity: '3 × 100 l' },
  { name: '4 × 35 l', dim: '92 × 23 × 74 cm', capacity: '4 × 35 l' },
  { name: '4 × 60 l', dim: '113 × 28 × 84 cm', capacity: '4 × 60 l' },
  { name: '4 × 100 l', dim: '132 × 33 × 94 cm', capacity: '4 × 100 l' },
])

const GEMINI_SIZES = sizes([
  { name: '1 × 35 l', dim: '36 × 27 × 75 cm', capacity: '1 × 35 l' },
  { name: '1 × 60 l', dim: '42 × 33 × 85 cm', capacity: '1 × 60 l' },
  { name: '1 × 100 l', dim: '49 × 40 × 95 cm', capacity: '1 × 100 l' },
  { name: '2 × 35 l', dim: '63 × 27 × 75 cm', capacity: '2 × 35 l' },
  { name: '2 × 60 l', dim: '75 × 33 × 85 cm', capacity: '2 × 60 l' },
  { name: '2 × 100 l', dim: '89 × 40 × 95 cm', capacity: '2 × 100 l' },
  { name: '3 × 35 l', dim: '89 × 27 × 75 cm', capacity: '3 × 35 l' },
  { name: '3 × 60 l', dim: '107 × 33 × 85 cm', capacity: '3 × 60 l' },
  { name: '3 × 100 l', dim: '128 × 40 × 95 cm', capacity: '3 × 100 l' },
  { name: '4 × 35 l', dim: '115 × 27 × 75 cm', capacity: '4 × 35 l' },
  { name: '4 × 60 l', dim: '139 × 33 × 85 cm', capacity: '4 × 60 l' },
  { name: '4 × 100 l', dim: '167 × 40 × 95 cm', capacity: '4 × 100 l' },
])

function pcSst(pc: Omit<MaterialFinish, 'name' | 'code'>, sst: Omit<MaterialFinish, 'name' | 'code'>): MaterialFinish[] {
  return [
    { name: MATERIAL_PC, code: 'PC', ...pc },
    { name: MATERIAL_SST, code: 'SST', ...sst },
  ]
}

const body: Pick<
  Product,
  | 'area'
  | 'manufacturer'
  | 'leadTime'
  | 'warranty'
  | 'ralInQuote'
  | 'sizeLegend'
  | 'documentPolicy'
  | 'reviewNote'
  | 'imageNote'
> = {
  area: 'offentlig',
  manufacturer: 'BINSIGNIA®',
  leadTime: LEAD,
  warranty: WARRANTY,
  ralInQuote: true,
  sizeLegend: 'Kapacitet',
  documentPolicy: DOCS,
  reviewNote: REVIEW,
  imageNote: IMAGE_NOTE,
}

export const binsigniaProducts: Record<string, Product> = {
  'askkopp-luna': {
    ...body,
    slug: 'askkopp-luna',
    name: 'Askkopp LUNA',
    sku: '9747',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Askkoppar',
    subcategorySlug: 'askkoppar',
    summary:
      'Slank askkopp 35 liter i pulverlackerad stålplåt eller rostfritt stål AISI 304.',
    description:
      'LUNA är en slank askkopp med kapacitet 35 liter. Pulverlackerat utförande är avsett för inomhus och skyddad utomhusmiljö. Rostfritt utförande i AISI 304 anges av tillverkaren för inomhus och utomhus i allväder. Stomme 1,2 mm, askkopp ingår. Tillval: lås. Valfri standard-RAL ingår för pulverlack; på rostfritt gäller RAL lock och innerkärl enligt prislistan september 2026. Märkning på valfritt språk ingår. Pris lämnas i offert.',
    images: [
      photo('luna-1.png', 'Askkopp LUNA, pulverlackerat exempelutförande', { size: '1 × 35 l' }),
      photo('luna-2.png', 'Askkopp LUNA, vinkel', { size: '1 × 35 l' }),
      photo('luna-3.png', 'Askkopp LUNA, detalj', { kind: 'detail', size: '1 × 35 l' }),
    ],
    material: 'Pulverlackerad stålplåt eller rostfritt stål',
    defaultSize: '1 × 35 l',
    sizes: sizes([{ name: '1 × 35 l', dim: '15 × 20 × 102 cm', capacity: '1 × 35 l' }]),
    sourceUrl: 'https://www.binsignia.com/product/luna-pc-modern-sheet-metal-ashtray',
    materials: pcSst(
      {
        sku: '9747',
        environment: 'Inomhus och skyddad utomhusmiljö',
        sourceUrl: 'https://www.binsignia.com/product/luna-pc-modern-sheet-metal-ashtray',
        standardFeatures: ['Stomme 1,2 mm stålplåt', 'Askkopp'],
        optionalFeatures: ['Lås'],
      },
      {
        sku: '9698',
        environment: 'Inomhus och utomhus i allväder',
        sourceUrl: 'https://www.binsignia.com/product/luna-sst-modern-stainless-steel-ashtray',
        standardFeatures: [
          'Stomme 1,2 mm',
          'AISI 304 rostfritt stål',
          'Väderbeständig enligt tillverkarens SST-sida',
          'Askkopp',
        ],
        optionalFeatures: ['Lås'],
      },
    ),
    variants: [LABELING],
    related: ['kallsortering-gemini', 'kallsortering-albris'],
  },
  'kallsortering-albris': {
    ...body,
    slug: 'kallsortering-albris',
    name: 'Källsortering ALBRIS',
    sku: '1088',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Källsortering',
    subcategorySlug: 'kallsortering',
    summary:
      'Källsorteringsstation med perforerad front och färgkodade innerkärl. 1–4 fraktioner à 35, 60 eller 100 liter.',
    description:
      'ALBRIS är en källsorteringsstation med perforerad front och färgkodade innerkärl. 1–4 fraktioner i 35, 60 eller 100 liter. Pulverlackerat utförande: inomhus och skyddad utomhusmiljö. Rostfritt AISI 304: inomhus och utomhus i allväder, enligt tillverkarens SST-sida. Ingår: innerhållare för säck, avtagbart lock, märkning och stomme 1,2 mm. Tillval beror på material (se utförande). Valfri standard-RAL ingår för pulverlack; på rostfritt gäller RAL lock och innerkärl. Pris lämnas i offert.',
    images: [
      photo('albris-1.png', 'Källsortering ALBRIS, pulverlackerat exempelutförande'),
      photo('albris-2.png', 'Källsortering ALBRIS, andra vinkel'),
    ],
    material: 'Pulverlackerad stålplåt eller rostfritt stål',
    defaultSize: '3 × 60 l',
    sizes: ALBRIS_SIZES,
    sourceUrl: 'https://www.binsignia.com/product/albris-pc-powder-coated-metal-recycle-bin',
    materials: pcSst(
      {
        sku: '1088',
        environment: 'Inomhus och skyddad utomhusmiljö',
        sourceUrl: 'https://www.binsignia.com/product/albris-pc-powder-coated-metal-recycle-bin',
        standardFeatures: [
          'Stomme 1,2 mm stålplåt',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
        ],
        optionalFeatures: ['Vippbart lock', 'Lås'],
      },
      {
        sku: '1096',
        environment: 'Inomhus och utomhus i allväder',
        sourceUrl: 'https://www.binsignia.com/product/albris-sst-modern-stainless-steel-recycle-bin',
        standardFeatures: [
          'Stomme 1,2 mm',
          'AISI 304 rostfritt stål',
          'Väderbeständig enligt tillverkarens SST-sida',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
        ],
        optionalFeatures: ['Vippbart lock', 'Hjul', 'Lås'],
      },
    ),
    variants: [LABELING],
    related: ['kallsortering-bernina', 'kallsortering-gemini', 'kallsortering-eiger'],
  },
  'kallsortering-bernina': {
    ...body,
    slug: 'kallsortering-bernina',
    name: 'Källsortering BERNINA',
    sku: '1107',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Källsortering',
    subcategorySlug: 'kallsortering',
    summary:
      'Rak källsorteringsbehållare för kontor, skola och gemensamma ytor. 1–4 fraktioner à 35, 60 eller 100 liter.',
    description:
      'BERNINA är en rak källsorteringsbehållare avsedd för vardagsbruk i kontor, skola och gemensamma ytor. 1–4 fraktioner i 35, 60 eller 100 liter. Pulverlackerat utförande: inomhus och skyddad utomhusmiljö. Rostfritt AISI 304: inomhus och utomhus i allväder, enligt tillverkarens SST-sida. Ingår: innerhållare för säck, avtagbart lock, märkning och stomme 1,2 mm. Tillval: vippbart lock, hjul och lås. Valfri standard-RAL ingår för pulverlack; på rostfritt gäller RAL lock och innerkärl. Pris lämnas i offert.',
    images: [
      photo('bernina-1.png', 'Källsortering BERNINA med märkning, exempelutförande'),
      photo('bernina-2.png', 'Källsortering BERNINA, andra vinkel'),
    ],
    material: 'Pulverlackerad stålplåt eller rostfritt stål',
    defaultSize: '3 × 60 l',
    sizes: BERNINA_SIZES,
    sourceUrl: 'https://www.binsignia.com/product/bernina-pc-powder-coated-modern-recycle-bin-station',
    materials: pcSst(
      {
        sku: '1107',
        environment: 'Inomhus och skyddad utomhusmiljö',
        sourceUrl:
          'https://www.binsignia.com/product/bernina-pc-powder-coated-modern-recycle-bin-station',
        standardFeatures: [
          'Stomme 1,2 mm stålplåt',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
        ],
        optionalFeatures: ['Vippbart lock', 'Hjul', 'Lås'],
      },
      {
        sku: '1114',
        environment: 'Inomhus och utomhus i allväder',
        sourceUrl:
          'https://www.binsignia.com/product/bernina-sst-modern-concept-stainless-steel-recycle-bin-station',
        standardFeatures: [
          'Stomme 1,2 mm',
          'AISI 304 rostfritt stål',
          'Väderbeständig enligt tillverkarens SST-sida',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
        ],
        optionalFeatures: ['Vippbart lock', 'Hjul', 'Lås'],
      },
    ),
    variants: [LABELING],
    related: ['kallsortering-albris', 'kallsortering-eiger', 'kallsortering-gemini'],
  },
  'kallsortering-eiger': {
    ...body,
    slug: 'kallsortering-eiger',
    name: 'Källsortering EIGER',
    sku: '14300',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Källsortering',
    subcategorySlug: 'kallsortering',
    summary:
      'Food court-station med tre fack à 100 liter och brickåterlämning ovanpå.',
    description:
      'EIGER är en station för food court och andra ytor med hög belastning vid servering. Tre fack à 100 liter och brickutrymme ovanpå. Pulverlackerat utförande: inomhus och skyddad utomhusmiljö. Rostfritt AISI 304: inomhus och utomhus i allväder, enligt tillverkarens SST-sida. AISI 304 anges inte för pulverlackerat utförande — raden förekommer på PC-sidan hos tillverkaren men hör till rostfritt. Ingår: innerhållare för säck, avtagbart lock, märkning, förvaringsfack med dörr och brickyta, stomme 1,2 mm. Tillval på pulverlack: vippbart lock och hjul. Valfri standard-RAL ingår för pulverlack. Pris lämnas i offert.',
    images: [
      photo('eiger-1.png', 'Källsortering EIGER med brickyta, exempelutförande', {
        size: '3 × 100 l',
      }),
      photo('eiger-2.png', 'Källsortering EIGER, andra vinkel', { size: '3 × 100 l' }),
    ],
    material: 'Pulverlackerad stålplåt eller rostfritt stål',
    defaultSize: '3 × 100 l',
    sizes: sizes([{ name: '3 × 100 l', dim: '174 × 39 × 97 cm', capacity: '3 × 100 l' }]),
    sourceUrl: 'https://www.binsignia.com/product/eiger-pc-modern-food-court-sheet-metal-trash-bin',
    materials: pcSst(
      {
        sku: '14300',
        environment: 'Inomhus och skyddad utomhusmiljö',
        sourceUrl:
          'https://www.binsignia.com/product/eiger-pc-modern-food-court-sheet-metal-trash-bin',
        standardFeatures: [
          'Stomme 1,2 mm stålplåt',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
          'Förvaringsfack med dörr och brickyta',
          'Ytor avsedda för enkel rengöring',
        ],
        optionalFeatures: ['Vippbart lock', 'Hjul'],
      },
      {
        sku: '14333',
        environment: 'Inomhus och utomhus i allväder',
        sourceUrl:
          'https://www.binsignia.com/product/eiger-sst-modern-food-court-stainless-steel-trash-bin',
        standardFeatures: [
          'Stomme 1,2 mm',
          'AISI 304 rostfritt stål',
          'Väderbeständig enligt tillverkarens SST-sida',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
          'Förvaringsfack med dörr och brickyta',
          'Ytor avsedda för enkel rengöring',
        ],
        optionalFeatures: [],
      },
    ),
    variants: [LABELING],
    related: ['kallsortering-albris', 'kallsortering-bernina'],
  },
  'kallsortering-gemini': {
    ...body,
    slug: 'kallsortering-gemini',
    name: 'Källsortering GEMINI',
    sku: '8661',
    category: 'Avfall och återvinning',
    categorySlug: 'avfall-atervinning',
    subcategory: 'Källsortering',
    subcategorySlug: 'kallsortering',
    summary:
      'Kompakt källsortering med integrerad askkopp. 1–4 fraktioner à 35, 60 eller 100 liter.',
    description:
      'GEMINI är en kompakt källsorteringsstation med integrerad askkopp. 1–4 fraktioner i 35, 60 eller 100 liter. Pulverlackerat utförande: inomhus och skyddad utomhusmiljö (så står det i tillverkarens specifikation; produktnamnet nämner utomhus). Rostfritt AISI 304: inomhus och utomhus i allväder. Ingår: innerhållare för säck, avtagbart lock, märkning, askkopp och stomme 1,2 mm. Tillval: vippbart lock. Valfri standard-RAL ingår för pulverlack; på rostfritt gäller RAL lock och innerkärl. Pris lämnas i offert.',
    images: [
      photo('gemini-1.png', 'Källsortering GEMINI med askkopp, exempelutförande'),
      photo('gemini-2.png', 'Källsortering GEMINI, andra vinkel'),
    ],
    material: 'Pulverlackerad stålplåt eller rostfritt stål',
    defaultSize: '2 × 60 l',
    sizes: GEMINI_SIZES,
    sourceUrl:
      'https://www.binsignia.com/product/gemini-pc-compact-outdoor-sheet-metal-recycle-bin-with-ashtray',
    materials: pcSst(
      {
        sku: '8661',
        environment: 'Inomhus och skyddad utomhusmiljö',
        sourceUrl:
          'https://www.binsignia.com/product/gemini-pc-compact-outdoor-sheet-metal-recycle-bin-with-ashtray',
        standardFeatures: [
          'Stomme 1,2 mm stålplåt',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
          'Askkopp',
        ],
        optionalFeatures: ['Vippbart lock'],
      },
      {
        sku: '8532',
        environment: 'Inomhus och utomhus i allväder',
        sourceUrl:
          'https://www.binsignia.com/product/gemini-sst-compact-outdoor-stainless-steel-recycle-bin-with-ashtray',
        standardFeatures: [
          'Stomme 1,2 mm',
          'AISI 304 rostfritt stål',
          'Väderbeständig enligt tillverkarens SST-sida',
          'Innerhållare för säck',
          'Avtagbart lock',
          'Märkning/dekaler ingår',
          'Askkopp',
        ],
        optionalFeatures: ['Vippbart lock'],
      },
    ),
    variants: [LABELING],
    related: ['askkopp-luna', 'kallsortering-albris', 'kallsortering-bernina'],
  },
}

export function selectedMaterial(product: Product, name?: string): MaterialFinish | undefined {
  if (!product.materials?.length) return undefined
  return product.materials.find((m) => m.name === name) ?? product.materials[0]
}
