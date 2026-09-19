import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { type Product, isPublicProduct } from '../data/content'
import { useProductCatalog } from '../context/ProductCatalogContext'
import { CatalogError, CatalogLoading } from '../components/CatalogStatus'
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
import { PRODUCT_LISTING_GRID, ProductCard } from '../components/ProductCard'
import { Breadcrumb } from '../components/Breadcrumb'
import { PlayActivityListing } from './PlayActivityPages'

const PLAY_SLUG_REDIRECTS: Record<string, string> = {
  'balans-rorelse': 'klattring-hinderbanor',
  sportytor: 'multisport-bollplaner',
}

function StatusNote({ sub }: { sub: SubcategoryDef }) {
  const status = subcategoryStatus(sub)
  const n = sub.productSlugs.length
  if (status === 'published') {
    return (
      <p className="text-sm text-muted">
        {n} {n === 1 ? 'produkt' : 'produkter'}
      </p>
    )
  }
  return (
    <p className="text-sm text-muted">
      0 produkter i den här underkategorin ännu.
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
        {empty ? '0 produkter' : `${n} ${n === 1 ? 'produkt' : 'produkter'}`}
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
        Åtta huvudkategorier med underkategorier. Gå från kategori till produkt.
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
  const { products, status, error, reload } = useProductCatalog()
  const category = findCategory(categorySlug)
  const [on, setOn] = useState<Record<string, string[]>>({})
  if (!category) return <Navigate to="/produkter" replace />
  if (category.slug === 'parkmobler' && subcategorySlug === 'solkraftverk') {
    return <Navigate to={categoryPath(category)} replace />
  }
  const redirected = category.slug === 'lek-aktivitet' && subcategorySlug
    ? PLAY_SLUG_REDIRECTS[subcategorySlug]
    : undefined
  if (redirected) {
    return <Navigate to={`/produkter/${category.slug}/${redirected}`} replace />
  }
  const sub = findSubcategory(category, subcategorySlug)
  if (!sub) return <Navigate to={categoryPath(category)} replace />
  if (category.slug === 'lek-aktivitet') {
    return <PlayActivityListing category={category} sub={sub} />
  }

  const items = sub.productSlugs.map((slug) => products[slug]).filter(isPublicProduct)
  const catalogPending = sub.productSlugs.length > 0 && status !== 'ready'
  const catalogFailed = catalogPending && status === 'error'
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
      if (f.legend === 'Utförande') {
        const optionHay = (p.optionGroups ?? [])
          .flatMap((g) => [g.label, ...g.options.map((o) => o.name)])
          .join(' ')
        const hay = `${p.name} ${p.summary} ${p.sku ?? ''} ${optionHay}`.toLowerCase()
        if (
          !sel.some((s) => {
            if (s === 'Trä') return hay.includes('trä') || /\bW\b/.test(p.sku ?? '')
            if (s === 'Klädd') return hay.includes('klädd') || /UPH/i.test(p.sku ?? '')
            return hay.includes(s.toLowerCase())
          })
        ) {
          return false
        }
      }
      if (f.legend === 'Typ') {
        const hay = `${p.name} ${p.summary}`.toLowerCase()
        if (
          !sel.some((s) => {
            if (s === 'Fällstol') return hay.includes('fällstol')
            if (s === 'Fällbänk') return hay.includes('fällbänk')
            return hay.includes(s.toLowerCase())
          })
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
    <div>
      <Breadcrumb
        items={[
          { label: 'Hem', to: '/' },
          { label: 'Sortiment', to: '/produkter' },
          { label: category.name, to: categoryPath(category) },
          { label: sub.name },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">{sub.name}</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted">{sub.blurb}</p>
          <div className="mt-2">
            <StatusNote sub={sub} />
          </div>
        </div>
        <p className="text-sm">
          <Link className="underline" to={categoryPath(category)}>
            Alla underkategorier i {category.name}
          </Link>
        </p>
      </div>
      {filters && !empty ? (
        <form className="mt-6 border-b border-line pb-4 text-sm" onSubmit={(e) => e.preventDefault()}>
          <p className="text-xs text-muted">Ingen markering = alla. Flera val inom samma grupp är eller.</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:gap-x-8 lg:gap-y-3">
            {filters.map((f) => (
              <fieldset key={f.legend} className="lg:flex lg:flex-wrap lg:items-center lg:gap-3">
                <legend className="font-medium lg:contents">{f.legend}</legend>
                {f.options.map((opt) => (
                  <label key={opt} className="mt-2 flex gap-2 lg:mt-0">
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
          </div>
        </form>
      ) : empty ? null : (
        <p className="mt-6 text-sm text-muted">Filter visas när underkategorin har produkter.</p>
      )}
      <div className="mt-6">
        {catalogFailed ? (
          <CatalogError message={error} onRetry={reload} />
        ) : catalogPending ? (
          <CatalogLoading />
        ) : empty ? (
          <div className="border border-dashed border-line p-6">
            <p className="font-medium">Inga produkter här ännu</p>
            <p className="mt-2 text-sm text-muted">
              Underkategorin är förberedd. Produkter läggs in när underlag finns.
            </p>
          </div>
        ) : filteredOut ? (
          <div className="border border-dashed border-line p-6">
            <p className="font-medium">Inga produkter matchar filtren</p>
            <p className="mt-2 text-sm text-muted">Ta bort någon markering för att se fler serier.</p>
          </div>
        ) : (
          <div className={PRODUCT_LISTING_GRID}>
            {visible.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
