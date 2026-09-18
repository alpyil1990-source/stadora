import { useEffect, useId, useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { ListingCard } from '../components/ListingCard'
import { Breadcrumb } from '../components/Breadcrumb'
import { products, type Product } from '../data/content'
import {
  categoryPath,
  type CategoryDef,
  type SubcategoryDef,
} from '../data/catalog'
import { api } from '../lib/api'

function useListingPreview() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    api('/api/preview/enter', { method: 'POST' })
      .catch(() => undefined)
      .finally(() => setReady(true))
  }, [])
  return ready
}

type SortKey = 'name-asc' | 'name-desc' | 'sku-asc'

function uniqueValues(items: Product[], pick: (p: Product) => string | undefined) {
  return [...new Set(items.map(pick).filter((v): v is string => Boolean(v)))]
}

function FilterFields({
  ageOpts,
  userOpts,
  age,
  users,
  onAge,
  onUsers,
}: {
  ageOpts: string[]
  userOpts: string[]
  age: string[]
  users: string[]
  onAge: (v: string) => void
  onUsers: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-5 text-sm lg:flex-row lg:flex-wrap lg:gap-x-8 lg:gap-y-3">
      {ageOpts.length > 0 && (
        <fieldset className="lg:flex lg:flex-wrap lg:items-center lg:gap-3">
          <legend className="font-medium lg:contents">Ålder</legend>
          {ageOpts.map((opt) => (
            <label key={opt} className="mt-2 flex gap-2 lg:mt-0">
              <input type="checkbox" checked={age.includes(opt)} onChange={() => onAge(opt)} />
              {opt}
            </label>
          ))}
        </fieldset>
      )}
      {userOpts.length > 0 && (
        <fieldset className="lg:flex lg:flex-wrap lg:items-center lg:gap-3">
          <legend className="font-medium lg:contents">Användare</legend>
          {userOpts.map((opt) => (
            <label key={opt} className="mt-2 flex gap-2 lg:mt-0">
              <input type="checkbox" checked={users.includes(opt)} onChange={() => onUsers(opt)} />
              {opt}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  )
}

export function PlayActivityListing({
  category,
  sub,
}: {
  category: CategoryDef
  sub: SubcategoryDef
}) {
  const previewReady = useListingPreview()
  const drawerId = useId()
  const [age, setAge] = useState<string[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('name-asc')
  const [drawer, setDrawer] = useState(false)

  const items = useMemo(
    () => sub.productSlugs.map((slug) => products[slug]).filter(Boolean),
    [sub.productSlugs],
  )
  const ageOpts = useMemo(() => uniqueValues(items, (p) => p.ageRange), [items])
  const userOpts = useMemo(() => uniqueValues(items, (p) => p.users), [items])

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const filtered = items.filter((p) => {
    if (age.length && (!p.ageRange || !age.includes(p.ageRange))) return false
    if (users.length && (!p.users || !users.includes(p.users))) return false
    return true
  })

  const visible = [...filtered].sort((a, b) => {
    if (sort === 'sku-asc') return (a.sku ?? '').localeCompare(b.sku ?? '', 'sv')
    const cmp = a.name.localeCompare(b.name, 'sv')
    return sort === 'name-desc' ? -cmp : cmp
  })

  const activeFilters = age.length + users.length
  const empty = items.length === 0
  const filteredOut = !empty && visible.length === 0

  function reset() {
    setAge([])
    setUsers([])
    setSort('name-asc')
  }

  if (!previewReady) {
    return <p className="text-sm text-muted">Öppnar listningen…</p>
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <Breadcrumb
        items={[
          { label: 'Hem', to: '/' },
          { label: 'Sortiment', to: '/produkter' },
          { label: category.name, to: categoryPath(category) },
          { label: sub.name },
        ]}
      />
      <h1 className="text-3xl md:text-4xl">{sub.name}</h1>
      {!empty && (
        <div className="mt-5 border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted">
              {visible.length} {visible.length === 1 ? 'produkt' : 'produkter'}
              {activeFilters ? ` av ${items.length}` : ''}
            </p>
            <label className="text-sm">
              Sortering
              <select
                className="ml-2 border border-line bg-sheet px-2 py-1"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="name-asc">Namn A–Ö</option>
                <option value="name-desc">Namn Ö–A</option>
                <option value="sku-asc">Artikelnummer</option>
              </select>
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-line px-3 py-1 text-sm lg:hidden"
              aria-expanded={drawer}
              aria-controls={drawerId}
              onClick={() => setDrawer(true)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filter{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            {(activeFilters > 0 || sort !== 'name-asc') && (
              <button type="button" className="text-sm underline" onClick={reset}>
                Återställ filter
              </button>
            )}
          </div>
          <div className="mt-3 hidden lg:block">
            <FilterFields
              ageOpts={ageOpts}
              userOpts={userOpts}
              age={age}
              users={users}
              onAge={(v) => toggle(age, v, setAge)}
              onUsers={(v) => toggle(users, v, setUsers)}
            />
          </div>
        </div>
      )}

      {empty ? (
        <div className="mt-8 border border-dashed border-line p-6">
          <p className="font-medium">Inga produkter här ännu</p>
          <p className="mt-2 text-sm text-muted">Kategorin är förberedd. Produkter läggs in när underlag finns.</p>
        </div>
      ) : filteredOut ? (
        <div className="mt-8 border border-dashed border-line p-6">
          <p className="font-medium">Inga produkter matchar filtren</p>
          <button type="button" className="mt-3 text-sm underline" onClick={reset}>
            Återställ filter
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
          {visible.map((p) => (
            <li key={p.slug} className="min-h-0">
              <ListingCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby={drawerId}>
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Stäng filter"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto border-t border-line bg-sheet p-5">
            <div className="flex items-center justify-between">
              <p id={drawerId} className="font-medium">
                Filter
              </p>
              <button type="button" className="p-2" aria-label="Stäng" onClick={() => setDrawer(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <FilterFields
                ageOpts={ageOpts}
                userOpts={userOpts}
                age={age}
                users={users}
                onAge={(v) => toggle(age, v, setAge)}
                onUsers={(v) => toggle(users, v, setUsers)}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="border border-line px-4 py-2 text-sm" onClick={reset}>
                Återställ filter
              </button>
              <button
                type="button"
                className="bg-ink px-4 py-2 text-sm text-sheet"
                onClick={() => setDrawer(false)}
              >
                Visa {visible.length} {visible.length === 1 ? 'produkt' : 'produkter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
