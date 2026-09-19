import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import gatedFile from '../../data/generated/streetpark-gated.json'
import { productPath, products } from '../../data/content'
import { STREETPARK_SLUGS, streetparkProducts } from '../../data/streetpark'
import {
  formatEur,
  netEur,
  STREETPARK_DEFAULT_DISCOUNT,
  streetparkCatalogSizesWithoutPrice,
  streetparkCatalogWithoutPrice,
  streetparkDiscounts,
  streetparkFamilies,
  streetparkGaps,
  streetparkPriceCounts,
  streetparkPriceMeta,
  streetparkPrices,
  streetparkProductOptions,
} from '../../data/streetpark-prices'

type GatedItem = {
  product?: string
  slug?: string
  name: string
  sourceUrl: string
  variant?: string | null
  fetchedAt?: string
  reason?: string
}

const ALL = 'all'
const UNMATCHED = 'unmatched'
const DEFAULT_PRODUCT = 'parkbank-berga'
const families = streetparkFamilies()
const productOptions = streetparkProductOptions()

export function AdminStreetparkTerms() {
  const items = (gatedFile.items as GatedItem[]) ?? []
  const catalogProducts = STREETPARK_SLUGS.map((slug) => streetparkProducts[slug]).filter(Boolean)
  const docs = catalogProducts.reduce((n, p) => n + (p.documents?.length ?? 0), 0)
  const images = catalogProducts.reduce((n, p) => n + p.images.length, 0)
  const cad = catalogProducts.reduce(
    (n, p) => n + (p.documents?.filter((d) => d.format === 'DWG' || d.format === 'DXF').length ?? 0),
    0,
  )

  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState(ALL)
  const requested = params.get('produkt')
  const productFilter =
    requested === UNMATCHED ||
    requested === ALL ||
    productOptions.some((p) => p.slug === requested)
      ? (requested ?? DEFAULT_PRODUCT)
      : DEFAULT_PRODUCT

  const visibleProducts =
    family === ALL ? productOptions : productOptions.filter((p) => p.family === family)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return streetparkPrices.filter((r) => {
      if (family !== ALL && r.family !== family) return false
      if (q) {
        return [r.sku, r.catalogSku, r.name, r.model, r.config, r.seriesName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      }
      if (productFilter === UNMATCHED) return !r.slug
      if (productFilter !== ALL && r.slug !== productFilter) return false
      return true
    })
  }, [family, productFilter, query])

  const selectedProduct = productFilter !== ALL && productFilter !== UNMATCHED ? products[productFilter] : undefined
  const unmatchedCount = streetparkPrices.filter((r) => !r.slug).length

  function setProductFilter(value: string) {
    const next = new URLSearchParams(params)
    next.set('produkt', value)
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-4">
      <section id="inkopspris" className="scroll-mt-8 space-y-6 border border-line bg-sheet p-5">
        <div>
          <p className="kicker">Intern inköpslista</p>
          <h2 className="mt-2 text-xl">{streetparkPriceMeta.list}</h2>
          <p className="mt-2 text-sm text-muted">
            {streetparkPriceMeta.note} Listpris och netto syns bara här, inte på katalogen. Ingen
            omräkning till SEK. {streetparkPriceCounts.rows} rader från PDF 2026/01 ·{' '}
            {streetparkPriceCounts.matched} kopplade till katalog-SKU.
          </p>
        </div>

        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li>
            <span className="text-muted">Juridiskt namn</span>
            <p className="font-medium">{streetparkPriceMeta.legal}</p>
          </li>
          <li>
            <span className="text-muted">Adress</span>
            <p className="font-medium">{streetparkPriceMeta.address}</p>
          </li>
          <li className="sm:col-span-2">
            <span className="text-muted">Webb</span>
            <p className="font-medium">{streetparkPriceMeta.website}</p>
          </li>
        </ul>

        <div className="overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>Årsomsättning</th>
                <th>Rabatt</th>
              </tr>
            </thead>
            <tbody>
              {streetparkDiscounts.map((d) => (
                <tr key={d.percent}>
                  <td>{d.label}</td>
                  <td className="tabular-nums">{d.percent} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted">{streetparkPriceMeta.vat}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {streetparkPriceMeta.terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Sortiment
            <select
              className="mt-1 block w-full border border-line bg-sheet px-3 py-2"
              value={family}
              onChange={(e) => {
                setFamily(e.target.value)
                setProductFilter(ALL)
              }}
            >
              <option value={ALL}>Alla</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Produkt
            <select
              className="mt-1 block w-full border border-line bg-sheet px-3 py-2"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value={ALL}>Alla med pris ({streetparkPrices.length})</option>
              {unmatchedCount > 0 && (
                <option value={UNMATCHED}>Ej i katalogen ({unmatchedCount})</option>
              )}
              {visibleProducts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          Sök artikelnummer eller modell
          <input
            className="mt-1 w-full border border-line bg-sheet px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="t.ex. BERGA eller LBG11"
          />
        </label>

        {selectedProduct && (
          <p className="text-sm">
            <Link className="underline" to={productPath(selectedProduct)}>
              Öppna {selectedProduct.name} (utan EUR på den publika sidan)
            </Link>
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>Lista-SKU</th>
                <th>Katalog-SKU</th>
                <th>Utförande</th>
                <th>Listpris</th>
                <th>Netto {STREETPARK_DEFAULT_DISCOUNT} %</th>
                <th>Netto 21 %</th>
                <th>Netto 22 %</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted">
                    Ingen rad matchar filtret.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.sku}-${r.config}`}>
                    <td className="tabular-nums">{r.sku}</td>
                    <td className="tabular-nums">{r.catalogSku ?? '—'}</td>
                    <td>
                      {r.slug ? (
                        <>
                          <span className="font-medium">{r.name}</span>
                          <span className="mt-1 block text-xs text-muted">{r.config}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{r.seriesName ?? r.name}</span>
                          <span className="mt-1 block text-xs text-muted">{r.config}</span>
                          {r.gap && <span className="mt-1 block text-xs">{r.gap}</span>}
                        </>
                      )}
                    </td>
                    <td className="tabular-nums">{formatEur(r.listEur)}</td>
                    <td className="tabular-nums font-medium">
                      {formatEur(netEur(r.listEur, STREETPARK_DEFAULT_DISCOUNT))}
                    </td>
                    <td className="tabular-nums">{formatEur(netEur(r.listEur, 21))}</td>
                    <td className="tabular-nums">{formatEur(netEur(r.listEur, 22))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">{rows.length} rader visade.</p>

        {streetparkCatalogWithoutPrice.length > 0 && (
          <div>
            <p className="text-sm font-medium">Katalogprodukter utan prisrad</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted">
              {streetparkCatalogWithoutPrice.map((p) => (
                <li key={p.slug}>
                  {p.name} ({p.model})
                </li>
              ))}
            </ul>
          </div>
        )}

        {streetparkGaps.length > 0 && (
          <div>
            <p className="text-sm font-medium">Prislistans rader utan katalogträff</p>
            <p className="mt-1 text-sm text-muted">
              AILES och ONE finns på EUR-listan men inte i den importerade katalogen. Tillbehör
              LRAXX (RADIANO-ben) har pris men ingen egen katalog-SKU.
            </p>
            <ul className="mt-2 max-h-48 overflow-auto divide-y divide-line border border-line text-sm">
              {streetparkGaps.map((g) => (
                <li key={g.sku} className="px-3 py-2">
                  <span className="font-medium">
                    {g.seriesName} · {g.sku}
                  </span>
                  <span className="block text-xs text-muted">
                    {g.config} · {formatEur(g.listEur)} · {g.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {streetparkCatalogSizesWithoutPrice.length > 0 && (
          <div>
            <p className="text-sm font-medium">Katalog-SKU utan rad på prislistan</p>
            <p className="mt-1 text-sm text-muted">
              Priset är inte påhittat. Modellerna finns i katalogen men saknas på PDF 2026/01, eller
              är en storlek som inte fanns på listan.
            </p>
            <ul className="mt-2 max-h-48 overflow-auto divide-y divide-line border border-line text-sm">
              {streetparkCatalogSizesWithoutPrice.map((s) => (
                <li key={`${s.slug}-${s.sku}`} className="px-3 py-2">
                  {s.name} · {s.sku}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-4 border border-line bg-sheet p-5">
        <p className="font-medium">STREETPARK-import</p>
        <p className="text-sm text-muted">
          {catalogProducts.length} produkter · {images} produktbilder · {docs} dokument, varav {cad}{' '}
          DWG. Tillverkare STREETPARK syns här internt, inte på den publika produktsidan. Leverantörens artikelnummer syns bara här, inte på hemsidan eller kundofferten. EUR-lista ovan är intern.
          Originalfiler från streetpark.eu {gatedFile.fetchedAt}.
        </p>
        <p className="text-sm">
          Exempel:{' '}
          {catalogProducts.slice(0, 4).map((p, i) => (
            <span key={p.slug}>
              {i > 0 ? ' · ' : ''}
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
            </span>
          ))}
        </p>
        <div>
          <p className="text-sm font-medium">Luckor efter inloggning</p>
          {items.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Inga kvarvarande inloggningsluckor i den här körningen. CAD, produktblad och
              förankringsfiler är kopplade till rätt modell på produktsidan.
            </p>
          ) : (
            <ul className="mt-2 max-h-80 overflow-auto divide-y divide-line border border-line text-sm">
              {items.map((g, i) => (
                <li key={`${g.name}-${g.variant ?? ''}-${i}`} className="px-3 py-2">
                  <span className="font-medium">{g.name}</span>
                  {g.variant ? <span className="text-muted"> · {g.variant}</span> : null}
                  {g.product ? <span className="block text-xs text-muted">{g.product}</span> : null}
                  <span className="block text-xs text-muted">
                    {g.sourceUrl} · {g.fetchedAt}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
