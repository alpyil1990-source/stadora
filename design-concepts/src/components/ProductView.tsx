import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/content'
import { productPath, products } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import { ProductCard } from './ProductCard'

export type ProductLayout = 'hybrid' | 'spec' | 'visual'

export function ProductView({
  product,
  layout,
}: {
  product: Product
  layout: ProductLayout
}) {
  const { add } = useQuote()
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [variants, setVariants] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    product.variants?.forEach((v) => {
      init[v.label] = v.options[0]
    })
    if (product.colors?.[0]) init['Kulör'] = product.colors[0]
    return init
  })
  const [added, setAdded] = useState(false)
  const [ask, setAsk] = useState(false)

  const variantLabel = Object.values(variants).filter(Boolean).join(' · ') || undefined
  const related = product.related
    .map((slug) => products[slug])
    .filter(Boolean)

  function addToQuote() {
    add({
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      variant: variantLabel,
      qty,
      href: productPath(product),
    })
    setAdded(true)
  }

  const jump = useMemo(() => {
    const items = [{ id: 'oversikt', label: 'Översikt' }]
    if (product.dimensions?.length) items.push({ id: 'matt', label: 'Mått och vikt' })
    if (product.material) items.push({ id: 'material', label: 'Material' })
    if (product.mounting?.length) items.push({ id: 'montering', label: 'Montering' })
    if (product.warranty || product.leadTime) items.push({ id: 'leverans', label: 'Leverans' })
    if (product.medicalClass) items.push({ id: 'standard', label: 'Standarder' })
    if (related.length) items.push({ id: 'serie', label: 'Samma serie' })
    return items
  }, [product, related.length])

  const gallery = (
    <div>
      <div className="aspect-[5/4] border border-line bg-paper">
        <img
          src={product.images[active]?.src}
          alt={product.images[active]?.alt}
          className="h-full w-full object-contain p-6"
        />
      </div>
      {product.imageNote && (
        <p className="mt-2 text-xs text-muted">{product.imageNote}</p>
      )}
      {product.images.length > 1 && (
        <ul className="mt-3 flex gap-2">
          {product.images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`h-16 w-16 border bg-paper p-1 ${
                  i === active ? 'border-ink' : 'border-line'
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
      {product.colors && (
        <fieldset>
          <legend className="text-sm font-medium">Kulör</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <label
                key={c}
                className={`cursor-pointer border px-3 py-2 text-sm ${
                  variants['Kulör'] === c ? 'border-ink bg-paper' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="color"
                  checked={variants['Kulör'] === c}
                  onChange={() => setVariants((v) => ({ ...v, Kulör: c }))}
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {product.variants?.map((v) => (
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
      {product.sku && (
        <div>
          <dt className="text-muted">Art.nr</dt>
          <dd className="font-medium tabular-nums">{product.sku}</dd>
        </div>
      )}
      {product.weight && (
        <div>
          <dt className="text-muted">Vikt</dt>
          <dd className="font-medium">{product.weight}</dd>
        </div>
      )}
      {product.dimensions?.[0] && (
        <div>
          <dt className="text-muted">{product.dimensions[0].label}</dt>
          <dd className="font-medium">{product.dimensions[0].value}</dd>
        </div>
      )}
      {product.material && (
        <div className="col-span-2">
          <dt className="text-muted">Material</dt>
          <dd className="font-medium">{product.material}</dd>
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
      {product.dimensions && product.dimensions.length > 0 && (
        <section id="matt">
          <h2 className="text-xl">Mått och vikt</h2>
          <table className="spec-table mt-3">
            <tbody>
              {product.dimensions.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
              {product.weight && (
                <tr>
                  <th>Vikt</th>
                  <td>{product.weight}</td>
                </tr>
              )}
              {product.capacity && (
                <tr>
                  <th>Kapacitet</th>
                  <td>{product.capacity}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
      {product.material && (
        <section id="material">
          <h2 className="text-xl">Material och ytbehandling</h2>
          <table className="spec-table mt-3">
            <tbody>
              <tr>
                <th>Material</th>
                <td>{product.material}</td>
              </tr>
              {product.cement && (
                <tr>
                  <th>Betong</th>
                  <td>{product.cement}</td>
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
      {product.environment && (
        <section>
          <h2 className="text-xl">Användningsmiljö</h2>
          <p className="mt-3 text-sm">{product.environment}</p>
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
      <section>
        <h2 className="text-xl">Dokument och underlag</h2>
        <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-muted">
          Inga verifierade datablad, CAD-filer eller certifikat är publicerade för den här
          produkten. Sektionen döljs i produktion när den är tom; den visas här för att visa
          hur luckor hanteras. Vi skriver inte att filer finns på begäran.
        </p>
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

  if (layout === 'visual') {
    return (
      <article>
        <LayoutNote title="B. Arkitekturledd" />
        <div className="-mx-4 md:mx-0">
          <div className="max-h-[72vh] overflow-hidden bg-ink">
            <img
              src={product.images.find((i) => i.kind === 'site')?.src ?? product.images[0].src}
              alt={product.images[0].alt}
              className="mx-auto max-h-[72vh] w-full object-contain"
            />
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
          {product.sku && (
            <p className="mt-2 font-ui text-sm tabular-nums text-muted">Art.nr {product.sku}</p>
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
