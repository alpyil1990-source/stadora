import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import type { Product, ProductDocument } from '../data/content'
import {
  documentsForVariant,
  isStadoraArticleNumber,
  productPath,
  products,
} from '../data/content'
import { selectedMaterial } from '../data/binsignia'
import {
  categoryPath,
  findCategory,
  findSubcategory,
  subcategoryPath,
} from '../data/catalog'
import {
  colorChoices,
  hasColorTaggedImages,
  hasSizeTaggedImages,
  imagesForVariant,
  shownLabel,
} from '../data/gallery'
import { useQuote } from '../context/QuoteContext'
import { ProductCard } from './ProductCard'
import { Breadcrumb } from './Breadcrumb'
import { ProductImageZoom } from './ProductLightbox'

export type ProductLayout = 'hybrid' | 'spec' | 'visual'

export function ProductView({
  product,
  layout,
}: {
  product: Product
  layout: ProductLayout
}) {
  const { add } = useQuote()
  const colors = colorChoices(product)
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [ral, setRal] = useState('')
  const [variants, setVariants] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    product.variants?.forEach((v) => {
      init[v.label] = v.options[0]
    })
    if (product.sizes?.length) {
      init['Storlek'] = product.defaultSize ?? product.sizes[0].name
    }
    if (product.materials?.length) {
      init['Material'] = product.defaultMaterial ?? product.materials[0].name
    }
    if (colors[0]) init['Kulör'] = colors[0].name
    return init
  })
  const [added, setAdded] = useState(false)
  const [ask, setAsk] = useState(false)

  const selectedSize = product.sizes?.find((s) => s.name === variants['Storlek'])
  const finish = selectedMaterial(product, variants['Material'])
  const sku = finish?.sku ?? selectedSize?.sku ?? product.sku
  const publicSku = isStadoraArticleNumber(sku) ? sku : undefined
  const dimensions = selectedSize?.dimensions ?? product.dimensions
  const weight = selectedSize?.weight ?? product.weight
  const capacity = selectedSize?.capacity ?? product.capacity
  const materialLabel = finish?.name ?? product.material
  const environment = finish?.environment ?? product.environment
  const standardFeatures = finish?.standardFeatures
  const optionalFeatures = finish?.optionalFeatures
  const sizeLegend = product.sizeLegend ?? 'Storlek'
  const sizePhotos = hasSizeTaggedImages(product.images)

  const galleryState = imagesForVariant(product.images, {
    color: variants['Kulör'],
    size: variants['Storlek'],
  })
  const shown = galleryState.shown
  const current = shown[Math.min(active, shown.length - 1)] ?? product.images[0]
  const taggedColors = hasColorTaggedImages(product.images)
  const missingColorPhoto =
    Boolean(variants['Kulör']) && taggedColors && !galleryState.colorMatched
  const missingSizePhoto =
    Boolean(variants['Storlek']) && sizePhotos && !galleryState.sizeMatched

  const variantParts = [
    variants['Storlek'],
    variants['Kulör'],
    ral.trim() ? `RAL ${ral.trim()}` : '',
    ...Object.entries(variants)
      .filter(([key]) => key !== 'Storlek' && key !== 'Kulör')
      .map(([, value]) => value),
  ].filter(Boolean)
  const variantLabel = variantParts.join(' · ') || undefined
  const related = product.related.map((slug) => products[slug]).filter(Boolean)
  const popKey = `${variants['Kulör'] ?? ''}-${variants['Storlek'] ?? ''}-${current?.src ?? ''}`

  function selectColor(name: string) {
    setVariants((v) => ({ ...v, Kulör: name }))
    setActive(0)
  }

  function selectSize(name: string) {
    setVariants((v) => ({ ...v, Storlek: name }))
    setActive(0)
  }

  function addToQuote() {
    add({
      slug: product.slug,
      name: product.name,
      sku,
      variant: variantLabel,
      qty,
      href: productPath(product),
      image: current?.src,
      imageAlt: current?.alt ?? product.name,
    })
    setAdded(true)
  }

  const jump = useMemo(() => {
    const items = [{ id: 'oversikt', label: 'Översikt' }]
    if (dimensions?.length) items.push({ id: 'matt', label: 'Mått och vikt' })
    if (materialLabel) items.push({ id: 'material', label: 'Material' })
    if (standardFeatures?.length || optionalFeatures?.length) {
      items.push({ id: 'utforande', label: 'Utförande' })
    }
    if (product.mounting?.length) items.push({ id: 'montering', label: 'Montering' })
    if (product.warranty || product.leadTime) items.push({ id: 'leverans', label: 'Leverans' })
    if (product.medicalClass) items.push({ id: 'standard', label: 'Standarder' })
    if ((product.documents && product.documents.length > 0) || product.documentPolicy) {
      items.push({ id: 'dokument', label: 'Dokument' })
    }
    if (related.length) items.push({ id: 'serie', label: 'Samma typ' })
    return items
  }, [
    dimensions,
    materialLabel,
    optionalFeatures?.length,
    product,
    related.length,
    standardFeatures?.length,
  ])

  const gallery = (
    <div>
      <div className="aspect-[5/4] overflow-hidden border border-line bg-paper">
        {current && (
          <ProductImageZoom
            images={shown}
            currentSrc={current.src}
            alt={current.alt}
            imgKey={popKey}
            imgClassName="gallery-pop h-full w-full object-contain p-6"
            onIndexChange={setActive}
          />
        )}
      </div>
      {product.imageNote && <p className="mt-2 text-xs text-muted">{product.imageNote}</p>}
      {missingSizePhoto && (
        <p className="mt-2 border border-dashed border-line bg-sheet px-3 py-2 text-xs text-muted">
          Ingen produktbild för {variants['Storlek']} ännu. Bilden visar {shownLabel(shown)}.
        </p>
      )}
      {missingColorPhoto && (
        <p className="mt-2 border border-dashed border-line bg-sheet px-3 py-2 text-xs text-muted">
          Ingen produktbild i {variants['Kulör']}. Bilden visar {shownLabel(shown)}. Offertlistan
          får ändå rätt kulör.
        </p>
      )}
      {shown.length > 1 && (
        <ul className="mt-3 flex gap-2">
          {shown.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`h-16 w-16 border bg-paper p-1 ${
                  i === Math.min(active, shown.length - 1) ? 'border-ink' : 'border-line'
                }`}
              >
                <img src={img.src} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const configure = (
    <div className="space-y-4">
      {product.sizes && product.sizes.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">{sizeLegend}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const hasPhoto = product.images.some((img) => img.size === s.name)
              const selected = variants['Storlek'] === s.name
              return (
                <label
                  key={s.name}
                  className={`cursor-pointer border px-3 py-2 text-sm ${
                    selected ? 'border-ink bg-paper' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="size"
                    checked={selected}
                    onChange={() => selectSize(s.name)}
                  />
                  <span className="block font-medium">{s.name}</span>
                  {isStadoraArticleNumber(s.sku) && (
                    <span className="block text-xs text-muted">Art.nr {s.sku}</span>
                  )}
                  {s.summary && s.summary !== s.name && (
                    <span className="block text-xs text-muted">{s.summary}</span>
                  )}
                  {sizePhotos && (
                    <span className="block text-xs text-muted">
                      {hasPhoto ? 'Produktbild finns' : 'Bild saknas — exempelbilden ligger kvar'}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      {product.materials && product.materials.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">Material</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.materials.map((m) => {
              const selected = variants['Material'] === m.name
              return (
                <label
                    key={m.sku}
                  className={`cursor-pointer border px-3 py-2 text-sm ${
                    selected ? 'border-ink bg-paper' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="material"
                    checked={selected}
                    onChange={() => setVariants((s) => ({ ...s, Material: m.name }))}
                  />
                  <span className="block font-medium">{m.name}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      {colors.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium">Kulör</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const hasPhoto = product.images.some((img) => img.color === c.name)
              const selected = variants['Kulör'] === c.name
              return (
                <label
                  key={c.name}
                  className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm ${
                    selected ? 'border-ink bg-paper' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="color"
                    checked={selected}
                    onChange={() => selectColor(c.name)}
                  />
                  {c.hex && (
                    <span
                      className="inline-block h-4 w-4 shrink-0 rounded-full border border-line"
                      style={{ background: c.hex }}
                      aria-hidden
                    />
                  )}
                  <span>
                    {c.name}
                    {taggedColors && (
                      <span className="mt-0.5 block text-xs text-muted">
                        {hasPhoto ? 'Byter bild' : 'Ingen unik bild'}
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      {product.ralInQuote && (
        <div>
          <label htmlFor="ral" className="text-sm font-medium">
            Kulör (RAL)
          </label>
          <p className="mt-1 text-xs text-muted">
            {finish?.code === 'SST'
              ? 'På rostfritt ingår RAL för lock eller innerkärl enligt prislistan. Ingen unik produktbild per kulör.'
              : 'Valfri standard-RAL ingår för pulverlack. Ingen unik produktbild per kulör — bilden är exempelutförande.'}{' '}
            Koden följer med till offertlistan.
          </p>
          <input
            id="ral"
            value={ral}
            onChange={(e) => setRal(e.target.value)}
            placeholder="t.ex. 7021"
            className="mt-2 w-40 border border-line bg-sheet px-3 py-2"
          />
        </div>
      )}
      {product.variants
        ?.filter((v) => !(v.label === 'Material' && product.materials?.length))
        .map((v) => (
        <fieldset key={v.label}>
          <legend className="text-sm font-medium">{v.label}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {v.options.map((opt) => (
              <label
                key={opt}
                className={`cursor-pointer border px-3 py-2 text-sm ${
                  variants[v.label] === opt ? 'border-ink bg-paper' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={v.label}
                  checked={variants[v.label] === opt}
                  onChange={() => setVariants((s) => ({ ...s, [v.label]: opt }))}
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div>
        <label htmlFor="qty" className="text-sm font-medium">
          Antal
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="mt-1 w-24 border border-line bg-sheet px-3 py-2"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addToQuote}
          className={`${layout === 'hybrid' ? 'hidden lg:inline-flex' : 'inline-flex'} bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet`}
        >
          Lägg i offertlista
        </button>
        <button
          type="button"
          onClick={() => setAsk(true)}
          className="border border-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
        >
          Fråga om produkten
        </button>
      </div>
      {added && (
        <p className="text-sm">
          Tillagd.{' '}
          <Link className="underline" to="/offertlista">
            Öppna offertlistan
          </Link>
        </p>
      )}
      {ask && (
        <form className="space-y-2 border border-line p-4" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm font-medium">Fråga om {product.name}</p>
          <label className="block text-sm">
            Meddelande
            <textarea className="mt-1 w-full border border-line p-2" rows={4} required />
          </label>
          <label className="block text-sm">
            E-post
            <input type="email" className="mt-1 w-full border border-line p-2" required />
          </label>
          <p className="text-xs text-muted">Koncept: formuläret skickas inte.</p>
        </form>
      )}
      <p className="text-sm text-muted">Pris lämnas i offert. Ingen e-handelskassa.</p>
    </div>
  )

  const keyFacts = (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      {publicSku && (
        <div>
          <dt className="text-muted">Art.nr</dt>
          <dd className="font-medium tabular-nums">{publicSku}</dd>
        </div>
      )}
      {product.manufacturer && (
        <div>
          <dt className="text-muted">Tillverkare</dt>
          <dd className="font-medium">{product.manufacturer}</dd>
        </div>
      )}
      {weight && (
        <div>
          <dt className="text-muted">Vikt</dt>
          <dd className="font-medium">{weight}</dd>
        </div>
      )}
      {dimensions?.[0] && (
        <div>
          <dt className="text-muted">{dimensions[0].label}</dt>
          <dd className="font-medium">{dimensions[0].value}</dd>
        </div>
      )}
      {materialLabel && (
        <div className="col-span-2">
          <dt className="text-muted">Material</dt>
          <dd className="font-medium">{materialLabel}</dd>
        </div>
      )}
      {product.medicalClass && (
        <div className="col-span-2">
          <dt className="text-muted">Klassning</dt>
          <dd className="font-medium">{product.medicalClass}</dd>
        </div>
      )}
    </dl>
  )

  const sections = (
    <div className="space-y-12">
      {dimensions && dimensions.length > 0 && (
        <section id="matt">
          <h2 className="text-xl">Mått och vikt</h2>
          <table className="spec-table mt-3">
            <tbody>
              {dimensions.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
              {weight && (
                <tr>
                  <th>Vikt</th>
                  <td>{weight}</td>
                </tr>
              )}
              {capacity && (
                <tr>
                  <th>Kapacitet</th>
                  <td>{capacity}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      {materialLabel && (
        <section id="material">
          <h2 className="text-xl">Material och ytbehandling</h2>
          <table className="spec-table mt-3">
            <tbody>
              <tr>
                <th>Material</th>
                <td>{materialLabel}</td>
              </tr>
              {product.cement && (
                <tr>
                  <th>Betong</th>
                  <td>{product.cement}</td>
                </tr>
              )}
              {product.wood && (
                <tr>
                  <th>Trä</th>
                  <td>{product.wood}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      {(standardFeatures?.length || optionalFeatures?.length) && (
        <section id="utforande">
          <h2 className="text-xl">Ingår och tillval</h2>
          <p className="mt-2 text-sm text-muted">Gäller valt material.</p>
          <table className="spec-table mt-3">
            <tbody>
              {standardFeatures && standardFeatures.length > 0 && (
                <tr>
                  <th>Ingår</th>
                  <td>
                    <ul className="list-disc space-y-1 pl-5">
                      {standardFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
              {optionalFeatures && optionalFeatures.length > 0 && (
                <tr>
                  <th>Tillval</th>
                  <td>
                    <ul className="list-disc space-y-1 pl-5">
                      {optionalFeatures.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      {product.mounting && product.mounting.length > 0 && (
        <section id="montering">
          <h2 className="text-xl">Montering och förankring</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {product.mounting.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}
      {environment && (
        <section>
          <h2 className="text-xl">Användningsmiljö</h2>
          <p className="mt-3 text-sm">{environment}</p>
        </section>
      )}
      {(product.warranty || product.leadTime) && (
        <section id="leverans">
          <h2 className="text-xl">Leverans och garanti</h2>
          <table className="spec-table mt-3">
            <tbody>
              {product.leadTime && (
                <tr>
                  <th>Leveranstid</th>
                  <td>{product.leadTime}</td>
                </tr>
              )}
              {product.warranty && (
                <tr>
                  <th>Garanti</th>
                  <td>{product.warranty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      {(product.medicalClass || product.manufacturerQms) && (
        <section id="standard">
          <h2 className="text-xl">Standarder och certifieringar</h2>
          <table className="spec-table mt-3">
            <tbody>
              {product.medicalClass && (
                <tr>
                  <th>Klassning</th>
                  <td>{product.medicalClass}</td>
                </tr>
              )}
              {product.manufacturerQms && (
                <tr>
                  <th>Tillverkarens ledningssystem</th>
                  <td>{product.manufacturerQms}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      <section id="dokument">
        <h2 className="text-xl">Dokument och underlag</h2>
        <ProductDocuments product={product} variant={variants['Storlek']} />
      </section>
      {related.length > 0 && (
        <section id="serie">
          <h2 className="text-xl">Samma typ i sortimentet</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )

  const visualSrc =
    shown.find((i) => i.kind === 'site')?.src ?? shown[0]?.src ?? product.images[0]?.src

  if (layout === 'visual') {
    return (
      <article>
        <LayoutNote title="B. Arkitekturledd" />
        <ReviewNote product={product} />
        <ProductNav product={product} />
        <div className="-mx-4 md:mx-0">
          <div className="max-h-[72vh] overflow-hidden bg-ink">
            {visualSrc && (
              <ProductImageZoom
                images={shown}
                currentSrc={visualSrc}
                alt={current?.alt ?? product.name}
                imgKey={popKey}
                imgClassName="gallery-pop mx-auto max-h-[72vh] w-full object-contain"
                onIndexChange={setActive}
              />
            )}
          </div>
        </div>
        <div className="mx-auto max-w-3xl py-12">
          <p className="kicker">{product.subcategory}</p>
          <h1 className="mt-3 text-4xl md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg text-muted">{product.summary}</p>
          <div className="mt-8">{configure}</div>
        </div>
        <div className="mx-auto max-w-3xl pb-16">{sections}</div>
      </article>
    )
  }

  if (layout === 'spec') {
    return (
      <article>
        <LayoutNote title="A. Upphandlingsledd" />
        <ReviewNote product={product} />
        <ProductNav product={product} />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">{gallery}</div>
          <div className="lg:col-span-8">
            <p className="kicker">{product.category}</p>
            <h1 className="mt-2 text-3xl">{product.name}</h1>
            <p className="mt-3 max-w-2xl text-muted">{product.description}</p>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                {keyFacts}
                {sections}
              </div>
              <div className="h-fit border border-line bg-sheet p-5 lg:sticky lg:top-28">
                <p className="kicker">Offert</p>
                <p className="mt-2 text-sm">Samla produkter till projektet. Pris i offert.</p>
                <div className="mt-4">{configure}</div>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article>
      <LayoutNote title="C. Hybrid — rekommenderas" />
      <ReviewNote product={product} />
      <ProductNav product={product} />
      <nav aria-label="På sidan" className="mb-6 flex flex-wrap gap-2 text-xs">
        {jump.map((j) => (
          <a
            key={j.id}
            className="border border-line px-2 py-1 text-sage-dark hover:border-ink"
            href={`#${j.id}`}
          >
            {j.label}
          </a>
        ))}
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-12" id="oversikt">
        <div className="lg:col-span-6">{gallery}</div>
        <div className="lg:col-span-6">
          <p className="kicker">
            {product.category} · {product.subcategory}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl">{product.name}</h1>
          {product.manufacturer && (
            <p className="mt-2 text-sm text-muted">Tillverkare {product.manufacturer}</p>
          )}
          {publicSku && (
            <p className="mt-2 font-ui text-sm tabular-nums text-muted">Art.nr {publicSku}</p>
          )}
          <p className="mt-4 max-w-xl text-muted">{product.description}</p>
          <div className="mt-6">{keyFacts}</div>
          <div className="mt-6">{configure}</div>
        </div>
      </div>
      <div className="mt-14">{sections}</div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sheet p-3 lg:hidden">
        <button
          type="button"
          onClick={addToQuote}
          className="w-full bg-ink py-3 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-sheet"
        >
          Lägg i offertlista
        </button>
      </div>
    </article>
  )
}

function LayoutNote({ title }: { title: string }) {
  return (
    <p className="mb-6 border border-line bg-paper px-3 py-2 text-xs text-muted">
      Produktsidelayout: <strong className="text-ink">{title}</strong>. Tomma sektioner utelämnas.
      Inga mått, certifikat eller dokument är påhittade.
    </p>
  )
}

function ReviewNote({ product }: { product: Product }) {
  if (!product.reviewNote) return null
  return (
    <p className="mb-6 border border-dashed border-line bg-sheet px-3 py-2 text-sm">
      {product.reviewNote}{' '}
      <Link className="underline" to="/design/binsignia">
        Öppna utkastöversikten
      </Link>
    </p>
  )
}

function productTrail(product: Product) {
  if (product.area === 'skola' || product.area === 'vard') {
    const home = product.area === 'skola' ? '/skola' : '/vard'
    const areaLabel = product.area === 'skola' ? 'Skola' : 'Vård'
    return {
      items: [
        { label: 'Hem', to: home },
        { label: areaLabel, to: home },
        { label: product.name },
      ],
      backTo: home,
      backLabel: `Tillbaka till ${areaLabel}`,
    }
  }

  const category = findCategory(product.categorySlug)
  const sub = category ? findSubcategory(category, product.subcategorySlug) : undefined
  const items: { label: string; to?: string }[] = [
    { label: 'Hem', to: '/' },
    { label: 'Sortiment', to: '/produkter' },
  ]
  if (category) items.push({ label: category.name, to: categoryPath(category) })
  if (category && sub) items.push({ label: sub.name, to: subcategoryPath(category, sub) })
  items.push({ label: product.name })

  return {
    items,
    backTo: category && sub ? subcategoryPath(category, sub) : '/produkter',
    backLabel: sub ? `Tillbaka till ${sub.name}` : 'Tillbaka till sortimentet',
  }
}

function ProductNav({ product }: { product: Product }) {
  const trail = productTrail(product)
  return (
    <div className="mb-8">
      <div className="-mb-3">
        <Breadcrumb items={trail.items} />
      </div>
      <Link
        to={trail.backTo}
        className="inline-flex items-center gap-2 border border-ink px-4 py-2.5 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {trail.backLabel}
      </Link>
    </div>
  )
}

function ProductDocuments({ product, variant }: { product: Product; variant?: string }) {
  const all = product.documents ?? []
  const docs = documentsForVariant(product, variant)

  if (all.length === 0) {
    if (product.documentPolicy) {
      return (
        <p className="mt-3 border border-line bg-paper px-4 py-5 text-sm">{product.documentPolicy}</p>
      )
    }
    return (
      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
        Inga verifierade datablad, CAD-filer eller certifikat är publicerade för den här produkten.
        Sektionen döljs i produktion när den är tom; den visas här för att visa hur luckor hanteras.
        Vi skriver inte att filer finns på begäran.
      </p>
    )
  }

  if (docs.length === 0) {
    return (
      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
        Inga underlag är kopplade till {variant}. Välj den modell som ritningen gäller, till exempel
        SKM1 för filer märkta SKM1.
      </p>
    )
  }

  return (
    <div className="mt-3">
      {variant && (
        <p className="mb-3 text-sm text-muted">
          Visar underlag för {variant} och filer som gäller hela serien.
        </p>
      )}
      <ul className="border border-line bg-sheet">
        {docs.map((doc) => (
          <DocumentRow key={`${doc.href}-${doc.variant ?? 'all'}`} doc={doc} />
        ))}
      </ul>
    </div>
  )
}

function DocumentRow({ doc }: { doc: ProductDocument }) {
  const label = `${doc.typeLabel} (${doc.format})`
  const alt = `${label}. ${doc.title}`
  return (
    <li className="grid gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-12 md:items-center">
      <div className="aspect-[4/3] overflow-hidden border border-line bg-paper md:col-span-3">
        {doc.previewable ? (
          <ProductImageZoom
            images={[{ src: doc.href, alt }]}
            currentSrc={doc.href}
            alt={alt}
            imgClassName="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full min-h-24 items-center justify-center font-ui text-xs uppercase tracking-[0.12em] text-muted">
            {doc.format}
          </div>
        )}
      </div>
      <div className="md:col-span-6">
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-sm text-muted">{doc.title}</p>
        {doc.variant && <p className="mt-1 text-xs text-muted">Modell {doc.variant}</p>}
        {doc.appliesTo && <p className="mt-1 text-xs text-muted">{doc.appliesTo}</p>}
      </div>
      <div className="md:col-span-3 md:text-right">
        <a
          href={doc.href}
          download
          className="inline-flex items-center gap-2 text-sm underline-offset-2 hover:underline"
        >
          <Download className="h-4 w-4" aria-hidden />
          Ladda ner original
        </a>
      </div>
    </li>
  )
}
