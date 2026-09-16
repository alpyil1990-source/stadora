import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { products, type Product } from '../data/content'
import {
  catalog,
  categoryPath,
  findCategory,
  findSubcategory,
  subcategoryPath,
  subcategoryStatus,
  type CategoryDef,
  type SubcategoryDef,
} from '../data/catalog'
import { ProductCard } from '../components/ProductCard'
import { Breadcrumb } from '../components/Breadcrumb'

function StatusNote({ sub }: { sub: SubcategoryDef }) {
  const status = subcategoryStatus(sub)
  const n = sub.productSlugs.length
  if (status === 'published') {
    return (
      <p className="text-sm text-muted">
        {n} {n === 1 ? 'publicerad produkt' : 'publicerade produkter'} i konceptet · pris i offert
      </p>
    )
  }
  return (
    <p className="text-sm text-muted">
      0 publicerade produkter. Underkategorin finns i menyn så att strukturen går att granska.
      Live-sajten har utkast med demo-bild — de visas inte som produktsidor.
    </p>
  )
}

function SubcategoryTile({
  category,
  sub,
}: {
  category: CategoryDef
  sub: SubcategoryDef
}) {
  const n = sub.productSlugs.length
  const empty = n === 0
  return (
    <Link
      to={subcategoryPath(category, sub)}
      className={`block p-5 ${empty ? 'border border-dashed border-line' : 'border border-line bg-sheet'}`}
    >
      <p className="font-medium">{sub.name}</p>
      <p className="mt-1 text-sm text-muted">{sub.blurb}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.08em] text-sage-dark">
        {empty ? 'Utkast · 0 publicerade' : `${n} i konceptet`}
      </p>
    </Link>
  )
}

export function CatalogIndexPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Hem', to: '/' }, { label: 'Sortiment' }]} />
      <p className="kicker">Offentlig miljö</p>
      <h1 className="mt-2 text-4xl">Sortiment</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Sju huvudkategorier, vardera med underkategorier. Du går Produkter → kategori → underkategori
        → produkt. Tomma underkategorier är klickbara: strukturen ska synas innan katalogdata är klar.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {catalog.map((c) => (
          <li key={c.slug}>
            <Link to={categoryPath(c)} className="block border border-line bg-sheet p-6 hover:border-ink">
              <h2 className="text-xl">{c.name}</h2>
              <p className="mt-2 text-sm text-muted">{c.blurb}</p>
              <p className="mt-4 text-sm text-sage-dark">
                {c.children.map((s) => s.name).join(' · ')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CategoryHubPage() {
  const { categorySlug } = useParams()
  const category = findCategory(categorySlug)
  if (!category) return <Navigate to="/produkter" replace />

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Hem', to: '/' },
          { label: 'Sortiment', to: '/produkter' },
          { label: category.name },
        ]}
      />
      <p className="kicker">Kategori</p>
      <h1 className="mt-2 text-4xl">{category.name}</h1>
      <p className="mt-4 max-w-2xl text-muted">{category.blurb}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {category.children.map((sub) => (
          <li key={sub.slug}>
            <SubcategoryTile category={category} sub={sub} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SubcategoryListPage() {
  const { categorySlug, subcategorySlug } = useParams()
  const category = findCategory(categorySlug)
  const [on, setOn] = useState<Record<string, string[]>>({})
  if (!category) return <Navigate to="/produkter" replace />
  const sub = findSubcategory(category, subcategorySlug)
  if (!sub) return <Navigate to={categoryPath(category)} replace />

  const items = sub.productSlugs.map((slug) => products[slug]).filter(Boolean)
  const filters = sub.filters

  function toggle(legend: string, opt: string) {
    setOn((prev) => {
      const cur = prev[legend] ?? []
      return {
        ...prev,
        [legend]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt],
      }
    })
  }

  function matches(p: Product) {
    for (const f of filters ?? []) {
      const sel = on[f.legend] ?? []
      if (sel.length === 0) continue
      if (f.legend === 'Material') {
        const hay = [p.material, ...(p.materials?.map((m) => m.name) ?? [])].join(' ').toLowerCase()
        if (
          !sel.some((s) => {
            const opt = s.toLowerCase()
            if (opt === 'stål') return hay.includes('stål') && !hay.includes('betong')
            return hay.includes(opt)
          })
        ) {
          return false
        }
      }
      if (f.legend === 'Form') {
        const hay = `${p.name} ${p.summary}`.toLowerCase()
        if (!sel.some((s) => hay.includes(s.toLowerCase()))) return false
      }
      if (f.legend === 'Ryggstöd') {
        const sizeBlob = (p.sizes ?? []).map((s) => `${s.name} ${s.summary ?? ''}`).join(' ')
        const text = `${p.name} ${p.summary} ${p.description} ${sizeBlob}`.toLowerCase()
        const withBack = text.includes('med ryggstöd')
        const without = text.includes('utan ryggstöd')
        if (!sel.some((s) => (s === 'Med ryggstöd' ? withBack : without))) return false
      }
      if (f.legend === 'Montering') {
        const hay = (p.mounting ?? []).join(' ').toLowerCase()
        if (
          !sel.some((s) => {
            if (s === 'Fristående') return hay.includes('fristående')
            if (s === 'Skruvas i underlaget') return hay.includes('skruv')
            return hay.includes(s.toLowerCase())
          })
        ) {
          return false
        }
      }
      if (f.legend === 'Fraktioner') {
        const sizes = p.sizes ?? []
        if (
          !sel.some((n) =>
            sizes.some((sz) => sz.name.startsWith(`${n} ×`) || sz.name.startsWith(`${n}×`)),
          )
        ) {
          return false
        }
      }
    }
    return true
  }

  const visible = items.filter(matches)
  const empty = items.length === 0
  const filteredOut = !empty && visible.length === 0

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <Breadcrumb
          items={[
            { label: 'Hem', to: '/' },
            { label: 'Sortiment', to: '/produkter' },
            { label: category.name, to: categoryPath(category) },
            { label: sub.name },
          ]}
        />
        <h1 className="text-3xl">{sub.name}</h1>
        <p className="mt-3 text-sm text-muted">{sub.blurb}</p>
        <div className="mt-4">
          <StatusNote sub={sub} />
        </div>
        {filters && !empty ? (
          <form className="mt-6 space-y-5 text-sm" onSubmit={(e) => e.preventDefault()}>
            <p className="text-xs text-muted">Ingen markering = alla. Flera val inom samma grupp är eller.</p>
            {filters.map((f) => (
              <fieldset key={f.legend}>
                <legend className="font-medium">{f.legend}</legend>
                {f.options.map((opt) => (
                  <label key={opt} className="mt-2 flex gap-2">
                    <input
                      type="checkbox"
                      checked={(on[f.legend] ?? []).includes(opt)}
                      onChange={() => toggle(f.legend, opt)}
                    />{' '}
                    {opt}
                  </label>
                ))}
              </fieldset>
            ))}
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Filter läggs till när det finns publicerade produkter i underkategorin. Värdena ska komma
            ur sortimentet — inte påhittade.
          </p>
        )}
        <p className="mt-8 text-sm">
          <Link className="underline" to={categoryPath(category)}>
            Alla underkategorier i {category.name}
          </Link>
        </p>
      </aside>
      <div className="lg:col-span-9">
        {empty ? (
          <div className="border border-dashed border-line p-6">
            <p className="font-medium">Inga publicerade produkter här ännu</p>
            <p className="mt-2 text-sm text-muted">
              Så här ser en underkategori ut innan miniminivån är uppfylld. Inga demo-bilder, inga
              påhittade mått. När en produkt har unik text, riktig bild och spec flyttas den upp som
              kort.
            </p>
            {sub.liveReady && sub.liveReady.length > 0 && (
              <div className="mt-5">
                <p className="kicker">Finns på live, inte i detta konceptkort</p>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {sub.liveReady.map((name) => (
                    <li key={name} className="border-b border-line py-2">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sub.draftExamples.length > 0 && (
              <div className="mt-5">
                <p className="kicker">Utkast på live-sajten (döljs publikt)</p>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {sub.draftExamples.map((name) => (
                    <li key={name} className="border-b border-line py-2">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : filteredOut ? (
          <div className="border border-dashed border-line p-6">
            <p className="font-medium">Inga produkter matchar filtren</p>
            <p className="mt-2 text-sm text-muted">Ta bort någon markering till vänster för att se fler serier.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
