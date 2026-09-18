import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import type { Product, ProductDocument, SizeOption } from '../data/content'
import {
  documentAccess,
  documentsForVariant,
  isCadOriginal,
  isStadoraArticleNumber,
  products,
  publicManufacturer,
  quoteShowsArticleNumber,
} from '../data/content'
import { useAuth } from '../context/AuthContext'
import { CadLoginPanel } from './CadLoginPanel'
import { selectedMaterial } from '../data/binsignia'
import {
  categoryPath,
  findCategory,
  findSubcategory,
  subcategoryPath,
} from '../data/catalog'
import {
  COLOR_VARIANT_KEY,
  initialVariantState,
  quoteDraftFromProduct,
  quoteLineSku,
  selectedTypeName,
  selectedTypeOption,
  withSelectedType,
} from '../data/configure'
import {
  colorChoices,
  hasColorTaggedImages,
  hasSizeTaggedImages,
  imagesForVariant,
  shownLabel,
} from '../data/gallery'
import {
  applyOptionChange,
  matchingImages,
  optionComplete,
  visibleGroups,
  weightForSelection,
} from '../data/inoplex-config'
import { finishSwatchHex, isStreetparkProduct } from '../data/streetpark-finishes'
import { useQuote } from '../context/QuoteContext'
import { ProductCard } from './ProductCard'
import { Breadcrumb } from './Breadcrumb'
import { ProductImageZoom } from './ProductLightbox'

export type ProductLayout = 'hybrid' | 'spec' | 'visual'

export function ProductView({
  product,
  layout,
  intern = false,
}: {
  product: Product
  layout: ProductLayout
  intern?: boolean
}) {
  const { add } = useQuote()
  const colors = colorChoices(product)
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [ral, setRal] = useState('')
  const [wish, setWish] = useState('')
  const [variants, setVariants] = useState<Record<string, string>>(() => {
    const init = initialVariantState(product)
    if (colors[0]) init[COLOR_VARIANT_KEY] = colors[0].name
    return init
  })
  const [added, setAdded] = useState(false)
  const [ask, setAsk] = useState(false)

  const typeName = selectedTypeName(product, variants)
  const selectedSize = selectedTypeOption(product, variants)
  const finish = selectedMaterial(product, variants['Material'])
  const sku = quoteLineSku(product, variants)
  const publicSku = quoteShowsArticleNumber(product, sku) ? sku : undefined
  const maker = intern ? product.manufacturer : publicManufacturer(product)
  const dimensions = selectedSize?.dimensions ?? product.dimensions
  const weight = selectedSize?.weight ?? product.weight
  const selectedWeight = weightForSelection(product, variants)
  const weightBesidePhoto = selectedWeight.beside
  const weightMissingFor = selectedWeight.missingFor
  const capacity = selectedSize?.capacity ?? product.capacity
  const materialLabel = finish?.name ?? product.material
  const environment = finish?.environment ?? product.environment
  const standardFeatures = finish?.standardFeatures
  const optionalFeatures = finish?.optionalFeatures
  const sizeLegend = product.sizeLegend ?? 'Storlek'
  const sizePhotos = hasSizeTaggedImages(product.images)
  const galleryLocked = isStreetparkProduct(product)
  const optionProduct = Boolean(product.optionGroups?.length)
  const optionOk = !optionProduct || optionComplete(product, variants)

  const galleryState = imagesForVariant(product.images, {
    color: variants[COLOR_VARIANT_KEY],
    size: typeName,
  })
  const inoplexGallery = optionProduct ? matchingImages(product, variants) : null
  const shown = galleryLocked
    ? product.images
    : inoplexGallery
      ? inoplexGallery.shown
      : galleryState.shown
  const current = shown[Math.min(active, shown.length - 1)] ?? product.images[0]
  const taggedColors = hasColorTaggedImages(product.images)
  const missingColorPhoto =
    !galleryLocked &&
    Boolean(variants[COLOR_VARIANT_KEY]) &&
    taggedColors &&
    !galleryState.colorMatched
  const missingSizePhoto =
    !galleryLocked && Boolean(typeName) && sizePhotos && !galleryState.sizeMatched

  const related = product.related.map((slug) => products[slug]).filter(Boolean)
  const popKey = galleryLocked
    ? (current?.src ?? '')
    : `${variants[COLOR_VARIANT_KEY] ?? ''}-${typeName ?? ''}-${current?.src ?? ''}`

  function selectColor(name: string) {
    setVariants((v) => ({ ...v, [COLOR_VARIANT_KEY]: name }))
    if (!galleryLocked) setActive(0)
  }

  function selectSize(name: string) {
    setVariants((v) => withSelectedType(v, name, product.sizeLegend))
    if (!galleryLocked) setActive(0)
  }

  function addToQuote() {
    if (optionProduct && !optionOk) return
    add(
      quoteDraftFromProduct(product, variants, {
        qty,
        ral,
        image: current?.src,
        imageAlt: current?.alt ?? product.name,
        comment: wish.trim() || undefined,
        imageExample: Boolean(optionProduct && inoplexGallery && !inoplexGallery.matched),
      }),
      product.area,
    )
    setAdded(true)
  }

  const jump = useMemo(() => {
    const items = [{ id: 'oversikt', label: 'Översikt' }]
    if (dimensions?.length || weight) items.push({ id: 'matt', label: 'Mått och vikt' })
    if (materialLabel) items.push({ id: 'material', label: 'Material' })
    if (standardFeatures?.length || optionalFeatures?.length) {
      items.push({ id: 'utforande', label: 'Utförande' })
    }
    if (product.mounting?.length) items.push({ id: 'montering', label: 'Montering' })
    if (product.safetyZoneArea || product.fallHeight || product.users || product.ageRange) {
      items.push({ id: 'sakerhet', label: 'Säkerhet' })
    }
    if (product.warranty || product.leadTime) items.push({ id: 'leverans', label: 'Leverans' })
    if (product.medicalClass || product.standards?.length) items.push({ id: 'standard', label: 'Standarder' })
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
    weight,
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
      {!intern && maker && (
        <p className="mt-2 text-sm font-medium">Tillverkare: {maker}</p>
      )}
      {optionProduct && inoplexGallery && !inoplexGallery.matched && (
        <p className="mt-2 border border-dashed border-line bg-sheet px-3 py-2 text-xs text-muted">
          Exempelbild – valt utförande kan avvika.
        </p>
      )}
      {!optionProduct && product.imageNote && (
        <p className="mt-2 text-xs text-muted">{product.imageNote}</p>
      )}
      {missingSizePhoto && (
        <p className="mt-2 border border-dashed border-line bg-sheet px-3 py-2 text-xs text-muted">
          Ingen produktbild för {typeName} ännu. Bilden visar {shownLabel(shown)}.
        </p>
      )}
      {missingColorPhoto && (
        <p className="mt-2 border border-dashed border-line bg-sheet px-3 py-2 text-xs text-muted">
          Ingen produktbild i {variants[COLOR_VARIANT_KEY]}. Bilden visar {shownLabel(shown)}. Offertlistan
          får ändå rätt kulör.
        </p>
      )}
      {shown.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
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
        isStreetparkProduct(product) ? (
          <StreetparkTypePicker
            legend={sizeLegend}
            sizes={product.sizes}
            selectedName={typeName}
            onSelect={selectSize}
            grayscaleIcons={galleryLocked}
          />
        ) : (
        <fieldset>
          <legend className="text-sm font-medium">{sizeLegend}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const hasPhoto = product.images.some((img) => img.size === s.name)
              const selected = typeName === s.name
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
        )
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
      {colors.length > 0 && !optionProduct && (
        isStreetparkProduct(product) ? (
          <FinishSwatchField
            legend={product.colorLegend ?? 'Kulör på metall'}
            options={colors.map((c) => ({ name: c.name, hex: c.hex, swatch: c.swatch }))}
            value={variants[COLOR_VARIANT_KEY]}
            inputName="color"
            columns={4}
            onSelect={selectColor}
          />
        ) : (
        <fieldset>
          <legend className="text-sm font-medium">Kulör</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => {
              const hasPhoto = product.images.some((img) => img.color === c.name)
              const selected = variants[COLOR_VARIANT_KEY] === c.name
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
        )
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
        .filter(() => !optionProduct)
        .map((v) =>
          isStreetparkProduct(product) ? (
            <FinishSwatchField
              key={v.label}
              legend={v.label}
              options={v.options.map((opt) => ({
                name: opt,
                hex: finishSwatchHex(opt),
                swatch: v.optionSwatches?.[opt],
              }))}
              value={variants[v.label]}
              inputName={v.label}
              columns={4}
              onSelect={(name) => setVariants((s) => ({ ...s, [v.label]: name }))}
            />
          ) : (
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
          ),
        )}
      {optionProduct &&
        visibleGroups(product, variants).map((g) => (
          <fieldset key={g.key}>
            <legend className="text-sm font-medium">{g.label}</legend>
            {g.hint && <p className="mt-1 max-w-md text-xs text-muted">{g.hint}</p>}
            <div className={`mt-2 flex flex-wrap gap-2 ${g.kind === 'swatch' ? 'items-start' : ''}`}>
              {g.options.map((opt) => {
                const selected = variants[g.key] === opt.name
                return (
                  <label
                    key={opt.id}
                    className={`cursor-pointer border px-3 py-2 text-sm ${
                      selected ? 'border-ink bg-paper' : 'border-line'
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={g.key}
                      checked={selected}
                      onChange={() => setVariants((s) => applyOptionChange(product, s, g.key, opt.name))}
                    />
                    <span className="flex items-center gap-2">
                      {opt.swatch && (
                        <img src={opt.swatch} alt="" className="h-8 w-8 border border-line object-contain" />
                      )}
                      <span>{opt.name}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {g.options.some((o) => o.customText && variants[g.key] === o.name) && (
              <label className="mt-2 block text-sm">
                Egen kulör
                <input
                  className="mt-1 w-full border border-line bg-sheet px-3 py-2"
                  value={variants[`${g.key}::egen`] ?? ''}
                  onChange={(e) => setVariants((s) => ({ ...s, [`${g.key}::egen`]: e.target.value }))}
                  placeholder="Ange kulör som leverantören ska offerera"
                />
              </label>
            )}
          </fieldset>
        ))}
      {optionProduct && (
        <label className="block text-sm">
          Specialönskemål
          <textarea
            className="mt-1 w-full border border-line bg-sheet px-3 py-2"
            rows={2}
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            placeholder="Valfritt. Följer med förfrågan."
          />
        </label>
      )}
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
          disabled={optionProduct && !optionOk}
          className={`${layout === 'hybrid' ? 'hidden lg:inline-flex' : 'inline-flex'} bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40`}
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
        </form>
      )}
      {optionProduct && !optionOk && (
        <p className="text-sm text-muted">Välj utförande, inklusive egen kulör om den är vald, innan raden läggs i offertlistan.</p>
      )}
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
      {maker && (
        <div>
          <dt className="text-muted">{intern ? 'Intern tillverkare' : 'Tillverkare'}</dt>
          <dd className="font-medium">
            {maker}
            {intern ? ' (visas inte publikt)' : ''}
          </dd>
        </div>
      )}
      {weightBesidePhoto && (
        <div>
          <dt className="text-muted">Vikt</dt>
          <dd className="font-medium">{weightBesidePhoto}</dd>
        </div>
      )}
      {weightMissingFor && (
        <div className="col-span-2">
          <dt className="text-muted">Vikt</dt>
          <dd className="font-medium">Anges inte för {weightMissingFor}</dd>
        </div>
      )}
      {dimensions?.[0] && (
        <div>
          <dt className="text-muted">{dimensions[0].label}</dt>
          <dd className="font-medium">{dimensions[0].value}</dd>
        </div>
      )}
      {materialLabel && !optionProduct && (
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
      {product.users && (
        <div>
          <dt className="text-muted">Användare</dt>
          <dd className="font-medium">{product.users}</dd>
        </div>
      )}
      {product.ageRange && (
        <div>
          <dt className="text-muted">Ålder</dt>
          <dd className="font-medium">{product.ageRange}</dd>
        </div>
      )}
      {product.fallHeight && (
        <div>
          <dt className="text-muted">Maximal fallhöjd</dt>
          <dd className="font-medium">{product.fallHeight}</dd>
        </div>
      )}
      {product.safetyZoneArea && (
        <div>
          <dt className="text-muted">Säkerhetsområde</dt>
          <dd className="font-medium">{product.safetyZoneArea}</dd>
        </div>
      )}
    </dl>
  )

  const sections = (
    <div className="space-y-12">
      {(dimensions?.length || weight) && (
        <section id="matt">
          <h2 className="text-xl">Mått och vikt</h2>
          <table className="spec-table mt-3">
            <tbody>
              {(dimensions ?? []).map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>
                    {row.value}
                    {row.note ? (
                      <p className="mt-1 text-xs font-normal text-muted">{row.note}</p>
                    ) : null}
                  </td>
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
      {(product.safetyZoneArea || product.fallHeight || product.users || product.ageRange) && (
        <section id="sakerhet">
          <h2 className="text-xl">Säkerhet och användning</h2>
          <table className="spec-table mt-3">
            <tbody>
              {product.users && (
                <tr>
                  <th>Antal användare</th>
                  <td>{product.users}</td>
                </tr>
              )}
              {product.ageRange && (
                <tr>
                  <th>Rekommenderad ålder</th>
                  <td>{product.ageRange}</td>
                </tr>
              )}
              {product.fallHeight && (
                <tr>
                  <th>Maximal fallhöjd</th>
                  <td>{product.fallHeight}</td>
                </tr>
              )}
              {product.safetyZoneArea && (
                <tr>
                  <th>Säkerhetsområde</th>
                  <td>{product.safetyZoneArea}</td>
                </tr>
              )}
              {product.safetyZonePerimeter && (
                <tr>
                  <th>Säkerhetsområdets omkrets</th>
                  <td>{product.safetyZonePerimeter}</td>
                </tr>
              )}
            </tbody>
          </table>
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
      {(product.medicalClass || product.manufacturerQms || product.standards?.length) && (
        <section id="standard">
          <h2 className="text-xl">Standarder och certifieringar</h2>
          <table className="spec-table mt-3">
            <tbody>
              {product.standards?.map((s) => (
                <tr key={s}>
                  <th>Norm</th>
                  <td>{s}</td>
                </tr>
              ))}
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
        <ProductDocuments
          product={product}
          variant={typeName}
          sizeLegend={sizeLegend}
          intern={intern}
        />
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
                <p className="mt-2 text-sm">Samla produkter till projektet.</p>
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
      {product.visibility === 'internal_preview' && (
        <p className="mb-6 border border-dashed border-line bg-sheet px-4 py-3 text-sm">
          Opublicerad intern förhandsgranskning. Produkten ingår inte i det publika sortimentet.
          Leverantör och originalfiler är interna tills skriftligt godkännande finns.
          {intern && product.manufacturer
            ? ` Intern tillverkare ${product.manufacturer} visas bara här.`
            : ''}
        </p>
      )}
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
          {intern && product.originalName && product.originalName !== product.name && (
            <p className="mt-2 text-sm text-muted">Originalnamn {product.originalName}</p>
          )}
          {maker && (
            <p className="mt-2 text-sm text-muted">
              {intern ? 'Intern tillverkare' : 'Tillverkare'} {maker}
              {intern ? ' — visas inte publikt' : ''}
            </p>
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
          disabled={optionProduct && !optionOk}
          className="w-full bg-ink py-3 font-ui text-xs font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40"
        >
          Lägg i offertlista
        </button>
      </div>
    </article>
  )
}

function productTrail(product: Product) {
  if (product.visibility === 'internal_preview') {
    return {
      items: [
        { label: 'Intern förhandsgranskning', to: '/intern' },
        { label: product.subcategory, to: '/intern' },
        { label: product.name },
      ],
      backTo: '/intern',
      backLabel: 'Tillbaka till intern förhandsgranskning',
    }
  }

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

function ProductDocuments({
  product,
  variant,
  sizeLegend = 'Modell',
  intern = false,
}: {
  product: Product
  variant?: string
  sizeLegend?: string
  intern?: boolean
}) {
  const { user } = useAuth()
  const location = useLocation()
  const all = product.documents ?? []
  const docs = documentsForVariant(product, variant)
  const modelPhrase = variant ? `${sizeLegend.toLowerCase()} ${variant}` : null
  const visible = intern ? docs : docs.filter((d) => documentAccess(d) !== 'internal_only')
  const cadUnlocked = intern || Boolean(user?.verified)
  const openDocs = visible.filter((d) => !isCadOriginal(d) || cadUnlocked)
  const lockedCad = visible.filter((d) => isCadOriginal(d) && !cadUnlocked)
  const drawing = visible.find(
    (d) => d.previewable && (d.kind === 'drawing' || d.kind === 'perspective'),
  )
  const backdrop = drawing
    ? { src: drawing.href, alt: drawing.typeLabel }
    : product.images[0]
      ? { src: product.images[0].src, alt: product.images[0].alt }
      : undefined

  if (all.length === 0) {
    if (product.documentPolicy) {
      return (
        <p className="mt-3 border border-line bg-paper px-4 py-5 text-sm">{product.documentPolicy}</p>
      )
    }
    return (
      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
        Inga datablad, CAD-filer eller certifikat är publicerade för den här produkten.
      </p>
    )
  }

  if (docs.length === 0 || (visible.length === 0 && lockedCad.length === 0)) {
    return (
      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
        Inga underlag för {modelPhrase ?? 'det valda utförandet'}.
      </p>
    )
  }

  const groups = groupDocuments(openDocs)

  return (
    <div className="mt-3">
      {modelPhrase && (
        <p className="mb-3 text-sm text-muted">
          Underlag för {modelPhrase}. Filer utan modellmärkning gäller hela serien.
        </p>
      )}
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {(groups.length > 1 || lockedCad.length > 0) && (
              <h3 className="mb-1.5 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
                {group.label}
              </h3>
            )}
            <ul className="border border-line bg-sheet">
              {group.items.map((doc) => (
                <DocumentRow
                  key={`${doc.href}-${doc.variant ?? 'all'}`}
                  doc={doc}
                  canDownload={intern || documentAccess(doc) !== 'registered_customer' || Boolean(user?.verified)}
                />
              ))}
            </ul>
          </div>
        ))}
        {lockedCad.length > 0 && (
          <div>
            <h3 className="mb-1.5 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
              CAD och originalfiler
            </h3>
            <CadLoginPanel
              heading={`${variant ?? product.name} — filer att ladda ner`}
              files={lockedCad}
              backdrop={backdrop}
              next={`${location.pathname}${location.search}#dokument`}
              unverified={Boolean(user && !user.verified)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function groupDocuments(docs: ProductDocument[]) {
  const buckets: { label: string; items: ProductDocument[] }[] = [
    { label: 'Ritningar', items: [] },
    { label: 'Produktblad och anvisningar', items: [] },
    { label: 'CAD och originalfiler', items: [] },
  ]
  for (const doc of docs) {
    if (doc.kind === 'drawing' || doc.kind === 'perspective' || doc.kind === 'image') {
      buckets[0].items.push(doc)
    } else if (doc.kind === 'cad' || doc.kind === 'other') {
      buckets[2].items.push(doc)
    } else {
      buckets[1].items.push(doc)
    }
  }
  return buckets.filter((bucket) => bucket.items.length > 0)
}

function DocumentRow({ doc, canDownload }: { doc: ProductDocument; canDownload: boolean }) {
  const alt = `${doc.typeLabel} (${doc.format}). ${doc.title}`
  const access = documentAccess(doc)
  const meta = [
    doc.format,
    doc.language === 'en' ? 'engelska' : doc.language === 'sv' ? 'svenska' : null,
    doc.appliesTo,
    access === 'internal_only' ? 'endast intern' : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const canOpenInBrowser =
    canDownload && (doc.previewable || doc.format === 'PDF' || doc.format === 'SVG')
  return (
    <li className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <div className="h-11 w-14 shrink-0 overflow-hidden border border-line bg-paper">
        {doc.previewable && canDownload ? (
          <ProductImageZoom
            compact
            images={[{ src: doc.href, alt }]}
            currentSrc={doc.href}
            alt={alt}
            imgClassName="h-full w-full object-contain p-0.5"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-ui text-[0.62rem] font-semibold tracking-[0.08em] text-muted">
            {doc.format}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{doc.typeLabel}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {meta}
          {meta ? ' · ' : ''}
          {doc.title}
        </p>
      </div>
      {canDownload && (
        <div className="flex shrink-0 items-center gap-3">
          {canOpenInBrowser && (
            <a
              href={doc.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Öppna ${doc.typeLabel} (${doc.format})`}
              className="text-sm underline-offset-2 hover:underline"
            >
              Öppna
            </a>
          )}
          <a
            href={doc.href}
            download
            aria-label={`Ladda ner ${doc.typeLabel} (${doc.format})`}
            className="inline-flex items-center gap-1.5 text-sm underline-offset-2 hover:underline"
          >
            <Download className="h-4 w-4" aria-hidden />
            Ladda ner
          </a>
        </div>
      )}
    </li>
  )
}

function StreetparkTypePicker({
  legend,
  sizes,
  selectedName,
  onSelect,
  grayscaleIcons = false,
}: {
  legend: string
  sizes: SizeOption[]
  selectedName?: string
  onSelect: (name: string) => void
  grayscaleIcons?: boolean
}) {
  const selected = sizes.find((s) => s.name === selectedName || s.sku === selectedName)
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {sizes.map((s) => {
          const active = selectedName === s.name || selectedName === s.sku
          return (
            <label
              key={s.sku ?? s.name}
              className={`flex cursor-pointer flex-col items-center border-2 bg-sheet px-1.5 py-2 text-center ${
                active ? 'border-sage bg-paper' : 'border-line'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name="size"
                checked={active}
                onChange={() => onSelect(s.name)}
              />
              <span className="flex aspect-[150/113] w-full items-center justify-center bg-paper">
                {s.icon ? (
                  <img
                    src={s.icon}
                    alt=""
                    className={`max-h-full max-w-full object-contain ${
                      grayscaleIcons ? 'grayscale' : ''
                    }`}
                  />
                ) : (
                  <span className="px-0.5 font-ui text-[0.65rem] font-semibold leading-tight text-ink">
                    {s.name}
                  </span>
                )}
              </span>
              <span className="mt-1 font-ui text-[0.68rem] font-semibold tracking-[0.04em] text-ink">
                {s.name}
              </span>
            </label>
          )
        })}
      </div>
      {selected?.summary && selected.summary !== selected.name && (
        <p className="mt-2 text-xs text-muted">
          {selected.name}: {selected.summary}
        </p>
      )}
    </fieldset>
  )
}

function FinishSwatchField({
  legend,
  options,
  value,
  inputName,
  onSelect,
  columns = 4,
}: {
  legend: string
  options: { name: string; hex?: string; swatch?: string }[]
  value?: string
  inputName: string
  onSelect: (name: string) => void
  columns?: 4 | 5
}) {
  const grid = columns === 5 ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-4'
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className={`mt-2 grid max-w-full gap-2 ${grid}`}>
        {options.map((opt) => {
          const active = value === opt.name
          return (
            <label
              key={opt.name}
              className={`flex cursor-pointer flex-col items-center gap-1 border-2 bg-sheet px-1 py-2 ${
                active ? 'border-sage bg-paper' : 'border-line'
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                name={inputName}
                checked={active}
                onChange={() => onSelect(opt.name)}
              />
              {opt.swatch ? (
                <span className="block aspect-[3/2] w-full overflow-hidden border border-line bg-paper">
                  <img src={opt.swatch} alt="" className="h-full w-full object-cover" />
                </span>
              ) : (
                <span
                  className="block aspect-[3/2] w-full border border-line"
                  style={opt.hex ? { background: opt.hex } : undefined}
                  aria-hidden
                />
              )}
              <span className="text-center text-[0.65rem] leading-tight">{opt.name}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
